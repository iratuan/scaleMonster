package com.guitarra.escalas;

import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Abre dentro da área segura: a tela fica entre a barra de status e a de navegação,
        // sem ser desenhada por baixo delas (modo imersivo) e sem invadir o entalhe da câmera.
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowManager.LayoutParams params = window.getAttributes();
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
            window.setAttributes(params);
        }
    }
}
