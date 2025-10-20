package com.himanshu.pharmalens;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class UpdateChecker {
    private static final String TAG = "UpdateChecker";
    private static final String GITHUB_API_URL = "https://api.github.com/repos/YOUR_USERNAME/mypharmalens/releases/latest";
    private static final String PREFS_NAME = "UpdatePrefs";
    private static final String LAST_CHECK_TIME = "last_check_time";
    private static final String CURRENT_VERSION = "current_version";
    
    private Context context;
    private OkHttpClient httpClient;
    private UpdateListener listener;
    
    public interface UpdateListener {
        void onUpdateAvailable(String newVersion, String downloadUrl);
        void onNoUpdateAvailable();
        void onUpdateCheckFailed(String error);
    }
    
    public UpdateChecker(Context context) {
        this.context = context;
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    }
    
    public void setUpdateListener(UpdateListener listener) {
        this.listener = listener;
    }
    
    public void checkForUpdates() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long lastCheckTime = prefs.getLong(LAST_CHECK_TIME, 0);
        long currentTime = System.currentTimeMillis();
        
        // Check for updates only once per hour to avoid API rate limiting
        if (currentTime - lastCheckTime < TimeUnit.HOURS.toMillis(1)) {
            Log.d(TAG, "Skipping update check - too recent");
            return;
        }
        
        new UpdateCheckTask().execute();
    }
    
    public void forceUpdateCheck() {
        new UpdateCheckTask().execute();
    }
    
    private class UpdateCheckTask extends AsyncTask<Void, Void, UpdateResult> {
        
        @Override
        protected UpdateResult doInBackground(Void... voids) {
            try {
                Request request = new Request.Builder()
                    .url(GITHUB_API_URL)
                    .addHeader("Accept", "application/vnd.github.v3+json")
                    .build();
                
                Response response = httpClient.newCall(request).execute();
                
                if (!response.isSuccessful()) {
                    return new UpdateResult(false, "HTTP " + response.code(), null, null);
                }
                
                String responseBody = response.body().string();
                Gson gson = new Gson();
                JsonObject releaseInfo = gson.fromJson(responseBody, JsonObject.class);
                
                String latestVersion = releaseInfo.get("tag_name").getAsString();
                String downloadUrl = null;
                
                // Look for APK download URL in assets
                if (releaseInfo.has("assets") && releaseInfo.get("assets").isJsonArray()) {
                    var assets = releaseInfo.get("assets").getAsJsonArray();
                    for (int i = 0; i < assets.size(); i++) {
                        var asset = assets.get(i).getAsJsonObject();
                        String assetName = asset.get("name").getAsString();
                        if (assetName.endsWith(".apk")) {
                            downloadUrl = asset.get("browser_download_url").getAsString();
                            break;
                        }
                    }
                }
                
                // Compare with current version
                String currentVersion = getCurrentAppVersion();
                boolean updateAvailable = isNewerVersion(latestVersion, currentVersion);
                
                // Update last check time
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit().putLong(LAST_CHECK_TIME, System.currentTimeMillis()).apply();
                
                return new UpdateResult(updateAvailable, null, latestVersion, downloadUrl);
                
            } catch (IOException e) {
                Log.e(TAG, "Network error during update check", e);
                return new UpdateResult(false, "Network error: " + e.getMessage(), null, null);
            } catch (Exception e) {
                Log.e(TAG, "Error during update check", e);
                return new UpdateResult(false, "Error: " + e.getMessage(), null, null);
            }
        }
        
        @Override
        protected void onPostExecute(UpdateResult result) {
            if (listener == null) return;
            
            if (result.error != null) {
                listener.onUpdateCheckFailed(result.error);
            } else if (result.updateAvailable) {
                listener.onUpdateAvailable(result.version, result.downloadUrl);
            } else {
                listener.onNoUpdateAvailable();
            }
        }
    }
    
    private String getCurrentAppVersion() {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0)
                .versionName;
        } catch (Exception e) {
            return "1.0";
        }
    }
    
    private boolean isNewerVersion(String latestVersion, String currentVersion) {
        // Simple version comparison - you might want to use a more sophisticated method
        try {
            String[] latestParts = latestVersion.replaceAll("[^0-9.]", "").split("\\.");
            String[] currentParts = currentVersion.replaceAll("[^0-9.]", "").split("\\.");
            
            int maxLength = Math.max(latestParts.length, currentParts.length);
            
            for (int i = 0; i < maxLength; i++) {
                int latestPart = i < latestParts.length ? Integer.parseInt(latestParts[i]) : 0;
                int currentPart = i < currentParts.length ? Integer.parseInt(currentParts[i]) : 0;
                
                if (latestPart > currentPart) {
                    return true;
                } else if (latestPart < currentPart) {
                    return false;
                }
            }
            
            return false; // Versions are equal
        } catch (Exception e) {
            Log.e(TAG, "Error comparing versions", e);
            return false;
        }
    }
    
    private static class UpdateResult {
        boolean updateAvailable;
        String error;
        String version;
        String downloadUrl;
        
        UpdateResult(boolean updateAvailable, String error, String version, String downloadUrl) {
            this.updateAvailable = updateAvailable;
            this.error = error;
            this.version = version;
            this.downloadUrl = downloadUrl;
        }
    }
}