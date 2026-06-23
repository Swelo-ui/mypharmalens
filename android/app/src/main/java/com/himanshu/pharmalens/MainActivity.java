package com.himanshu.pharmalens;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.net.Uri;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.provider.MediaStore;
import java.io.File;
import java.io.IOException;
import android.os.Environment;
import androidx.core.content.FileProvider;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.app.AlertDialog;
import android.widget.Toast;
import android.os.Build;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

public class MainActivity extends Activity {

    private WebView webView;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    private static final int FILE_CHOOSER_REQUEST_CODE = 1002;
    private ValueCallback<Uri[]> fileUploadCallback;
    private String cameraPhotoPath;
    
    // Auto-update components
    private UpdateChecker updateChecker;
    private UpdateDownloader updateDownloader;
    private Handler mainHandler;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Configure status bar and navigation bar
        configureSystemUI();

        // Initialize auto-update components
        initializeAutoUpdate();

        // Initialize WebView
        webView = findViewById(R.id.webview);
        configureWebView();

        // Load the PWA
        webView.loadUrl("https://pharmalens-drug-identify.vercel.app");
        
        // Check for updates after a short delay
        mainHandler.postDelayed(() -> updateChecker.checkForUpdates(), 3000);
    }

    private void configureSystemUI() {
        Window window = getWindow();
        
        // Enable fullscreen mode for TWA
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
            
            // Hide system UI for immersive fullscreen
            View decorView = window.getDecorView();
            int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
            decorView.setSystemUiVisibility(uiOptions);
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.BLACK);
            window.setNavigationBarColor(Color.BLACK);
        }
    }
    
    private void initializeAutoUpdate() {
        mainHandler = new Handler(Looper.getMainLooper());
        
        // Initialize update checker
        updateChecker = new UpdateChecker(this);
        updateChecker.setUpdateListener(new UpdateChecker.UpdateListener() {
            @Override
            public void onUpdateAvailable(String newVersion, String downloadUrl) {
                showUpdateDialog(newVersion, downloadUrl);
            }
            
            @Override
            public void onNoUpdateAvailable() {
                // Silently continue - no need to notify user
            }
            
            @Override
            public void onUpdateCheckFailed(String error) {
                // Log error but don't disturb user experience
                android.util.Log.w("UpdateChecker", "Update check failed: " + error);
            }
        });
        
        // Initialize update downloader
        updateDownloader = new UpdateDownloader(this);
        updateDownloader.setDownloadListener(new UpdateDownloader.DownloadListener() {
            @Override
            public void onDownloadStarted() {
                Toast.makeText(MainActivity.this, "Downloading update...", Toast.LENGTH_SHORT).show();
            }
            
            @Override
            public void onDownloadProgress(int progress) {
                // Progress is handled by notification
            }
            
            @Override
            public void onDownloadCompleted(String filePath) {
                Toast.makeText(MainActivity.this, "Update downloaded! Tap notification to install.", Toast.LENGTH_LONG).show();
            }
            
            @Override
            public void onDownloadFailed(String error) {
                Toast.makeText(MainActivity.this, "Update download failed: " + error, Toast.LENGTH_LONG).show();
            }
        });
    }
    
    private void showUpdateDialog(String newVersion, String downloadUrl) {
        new AlertDialog.Builder(this)
            .setTitle("Update Available")
            .setMessage("A new version (" + newVersion + ") of PharmaLens is available. Would you like to download and install it?")
            .setPositiveButton("Update Now", (dialog, which) -> {
                updateDownloader.downloadUpdate(downloadUrl, newVersion);
            })
            .setNegativeButton("Later", (dialog, which) -> {
                dialog.dismiss();
            })
            .setNeutralButton("Check Again", (dialog, which) -> {
                updateChecker.forceUpdateCheck();
            })
            .setCancelable(false)
            .show();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (updateDownloader != null) {
            updateDownloader.cleanup();
        }
    }

    private void configureWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enhanced performance settings
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        
        // Modern caching strategy - using WebView's built-in cache management
        // setAppCacheEnabled and setAppCachePath are deprecated and removed in newer APIs
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Advanced caching and performance optimizations
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        webSettings.setEnableSmoothTransition(true);
        webSettings.setPluginState(WebSettings.PluginState.ON_DEMAND);
        
        // Hardware acceleration and GPU rendering
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        }
        
        // Memory and performance optimizations
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(false);
        webSettings.setTextZoom(100);
        
        // Network and loading optimizations
        webSettings.setBlockNetworkImage(false);
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Enhanced User Agent for better compatibility
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent + " TWA PharmaLens/2.0");
        
        // Enable smooth scrolling
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
                // Smooth scrolling behavior
            });
        }
        
        // Set background color
        webView.setBackgroundColor(getResources().getColor(R.color.background_light));
        
        // Performance monitoring and caching
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.contains("pharmalens-drug-identify.vercel.app")) {
                    return false; // Let WebView handle pharmalens.tech URLs
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Inject performance optimizations
                view.evaluateJavascript(
                    "if (typeof window.performance !== 'undefined') {" +
                    "  window.performance.mark('twa-page-loaded');" +
                    "}", null);
            }
            
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // Implement intelligent caching for static resources
                String url = request.getUrl().toString();
                if (url.endsWith(".css") || url.endsWith(".js") || url.endsWith(".png") || 
                    url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".webp")) {
                    // Let the default caching mechanism handle these
                    return super.shouldInterceptRequest(view, request);
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        // Set WebChromeClient to handle file uploads and camera permissions
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
                    File photoFile = null;
                    try {
                        photoFile = createImageFile();
                    } catch (IOException ex) {
                        // Error occurred while creating the File
                    }
                    if (photoFile != null) {
                        Uri photoURI = FileProvider.getUriForFile(MainActivity.this,
                                "com.himanshu.pharmalens.fileprovider",
                                photoFile);
                        takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                    }
                }

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("image/*");

                Intent[] intentArray;
                if (takePictureIntent != null) {
                    intentArray = new Intent[]{takePictureIntent};
                } else {
                    intentArray = new Intent[0];
                }

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Image Chooser");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                return true;
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    // Check if camera permission is requested
                    for (String resource : request.getResources()) {
                        if (resource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) 
                                    == PackageManager.PERMISSION_GRANTED) {
                                request.grant(request.getResources());
                            } else {
                                ActivityCompat.requestPermissions(MainActivity.this,
                                        new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
                            }
                            return;
                        }
                    }
                    request.grant(request.getResources());
                }
            }
        });
    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new java.text.SimpleDateFormat("yyyyMMdd_HHmmss").format(new java.util.Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(
                imageFileName,  /* prefix */
                ".jpg",         /* suffix */
                storageDir      /* directory */
        );

        // Save a file: path for use with ACTION_VIEW intents
        cameraPhotoPath = image.getAbsolutePath();
        return image;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (fileUploadCallback == null) return;
            
            Uri[] results = null;
            
            if (resultCode == Activity.RESULT_OK) {
                if (data == null) {
                    // If there is not data, then we may have taken a photo
                    if (cameraPhotoPath != null) {
                        results = new Uri[]{Uri.fromFile(new File(cameraPhotoPath))};
                    }
                } else {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
            }
            
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Camera permission granted, reload the page to enable camera functionality
                webView.reload();
            }
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
