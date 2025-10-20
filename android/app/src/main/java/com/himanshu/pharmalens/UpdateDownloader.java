package com.himanshu.pharmalens;

import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.Manifest;
import java.io.File;

public class UpdateDownloader {
    private static final String TAG = "UpdateDownloader";
    private static final String CHANNEL_ID = "update_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private Context context;
    private DownloadManager downloadManager;
    private NotificationManager notificationManager;
    private long downloadId = -1;
    private DownloadListener listener;
    
    public interface DownloadListener {
        void onDownloadStarted();
        void onDownloadProgress(int progress);
        void onDownloadCompleted(String filePath);
        void onDownloadFailed(String error);
    }
    
    private BroadcastReceiver downloadReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if (id == downloadId) {
                handleDownloadComplete();
            }
        }
    };
    
    public UpdateDownloader(Context context) {
        this.context = context;
        this.downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        createNotificationChannel();
        registerDownloadReceiver();
    }
    
    public void setDownloadListener(DownloadListener listener) {
        this.listener = listener;
    }
    
    public void downloadUpdate(String downloadUrl, String version) {
        if (downloadUrl == null || downloadUrl.isEmpty()) {
            if (listener != null) {
                listener.onDownloadFailed("Invalid download URL");
            }
            return;
        }
        
        try {
            // Create download request
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
            
            // Set download destination
            String fileName = "PharmaLens_v" + version + ".apk";
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            
            // Set request properties
            request.setTitle("PharmaLens Update");
            request.setDescription("Downloading version " + version);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_WIFI | DownloadManager.Request.NETWORK_MOBILE);
            request.setAllowedOverRoaming(false);
            
            // Start download
            downloadId = downloadManager.enqueue(request);
            
            showDownloadNotification("Starting download...", 0);
            
            if (listener != null) {
                listener.onDownloadStarted();
            }
            
            // Start progress monitoring
            monitorDownloadProgress();
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting download", e);
            if (listener != null) {
                listener.onDownloadFailed("Failed to start download: " + e.getMessage());
            }
        }
    }
    
    private void monitorDownloadProgress() {
        new Thread(() -> {
            boolean downloading = true;
            while (downloading) {
                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(downloadId);
                
                Cursor cursor = downloadManager.query(query);
                if (cursor.moveToFirst()) {
                    int status = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS));
                    
                    switch (status) {
                        case DownloadManager.STATUS_RUNNING:
                            int bytesDownloaded = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                            int bytesTotal = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                            
                                if (bytesTotal > 0) {
                                    int progress = (int) ((bytesDownloaded * 100L) / bytesTotal);
                                    
                                    // Use Handler to post to main thread instead of runOnUiThread
                                    new Handler(Looper.getMainLooper()).post(() -> {
                                        showDownloadNotification("Downloading update...", progress);
                                        if (listener != null) {
                                            listener.onDownloadProgress(progress);
                                        }
                                    });
                                }
                            break;
                            
                        case DownloadManager.STATUS_SUCCESSFUL:
                        case DownloadManager.STATUS_FAILED:
                            downloading = false;
                            break;
                    }
                }
                cursor.close();
                
                try {
                    Thread.sleep(1000); // Update every second
                } catch (InterruptedException e) {
                    downloading = false;
                }
            }
        }).start();
    }
    
    private void handleDownloadComplete() {
        DownloadManager.Query query = new DownloadManager.Query();
        query.setFilterById(downloadId);
        
        Cursor cursor = downloadManager.query(query);
        if (cursor.moveToFirst()) {
            int status = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS));
            
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                String filePath = cursor.getString(cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI));
                
                showCompletedNotification("Download completed", "Tap to install update");
                
                if (listener != null) {
                    listener.onDownloadCompleted(filePath);
                }
                
                // Auto-install if possible
                installUpdate(filePath);
                
            } else {
                String reason = cursor.getString(cursor.getColumnIndex(DownloadManager.COLUMN_REASON));
                
                if (listener != null) {
                    listener.onDownloadFailed("Download failed: " + reason);
                }
            }
        }
        cursor.close();
    }
    
    private void installUpdate(String filePath) {
        try {
            File apkFile = new File(Uri.parse(filePath).getPath());
            
            if (!apkFile.exists()) {
                Log.e(TAG, "APK file not found: " + filePath);
                return;
            }
            
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Use FileProvider for Android 7.0+
                Uri apkUri = FileProvider.getUriForFile(context, 
                    context.getPackageName() + ".fileprovider", apkFile);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                installIntent.setDataAndType(Uri.fromFile(apkFile), "application/vnd.android.package-archive");
            }
            
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(installIntent);
            
        } catch (Exception e) {
            Log.e(TAG, "Error installing update", e);
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "App Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Notifications for app updates");
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    private void showDownloadNotification(String message, int progress) {
        // Check for notification permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Notification permission not granted, skipping notification");
                return;
            }
        }
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("PharmaLens Update")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setOngoing(true);
            
        if (progress > 0) {
            builder.setProgress(100, progress, false);
        } else {
            builder.setProgress(0, 0, true);
        }
        
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }
    
    private void showCompletedNotification(String title, String message) {
        // Check for notification permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Notification permission not granted, skipping notification");
                return;
            }
        }
        
        Intent installIntent = new Intent(Intent.ACTION_VIEW);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, installIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);
        
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }
    
    private void registerDownloadReceiver() {
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        context.registerReceiver(downloadReceiver, filter);
    }
    
    public void cleanup() {
        try {
            context.unregisterReceiver(downloadReceiver);
        } catch (Exception e) {
            // Receiver might not be registered
        }
    }
}