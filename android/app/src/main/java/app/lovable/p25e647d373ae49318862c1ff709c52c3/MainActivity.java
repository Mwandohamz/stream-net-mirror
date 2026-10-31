package app.lovable.p25e647d373ae49318862c1ff709c52c3;

import com.getcapacitor.BridgeActivity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Let the user's selected password manager handle credentials; never save them ourselves.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && getBridge() != null) {
            getBridge().getWebView().setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
        }
    }
}
