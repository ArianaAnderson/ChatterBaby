package org.chatterbaby.chatterbaby;

import android.graphics.Color;
import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class FAQActivity extends AppCompatActivity {

    private String faqLink = "https://docs.google.com/document/d/1wXELtFDXSxVaVlRl8HBGEXSfKu1JYgLBEcH2dYJmL50/edit?usp=sharing";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_faq);
        setToolbar();

        // create a WebView with the current EULA
        WebView webView = (WebView) findViewById(R.id.faqWebView);
        webView.loadUrl(faqLink);
        webView.setBackgroundColor(Color.rgb(235,235,240));
        webView.setWebViewClient(new WebViewClient());
        webView.canGoBack();
    }

    private void setToolbar() {
        // Attaching the layout to the toolbar object
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        // Setting toolbar as the ActionBar with setSupportActionBar() call
        setSupportActionBar(toolbar);
        ActionBar ab = getSupportActionBar();
        ab.setDisplayHomeAsUpEnabled(true);
    }
}
