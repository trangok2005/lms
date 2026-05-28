import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

/**
 * Custom CKEditor 5 Component for React Native
 * Uses WebView to load the official CKEditor via CDN.
 */
const CKEditor = ({ value, onChange, height = 250 }) => {
    const webViewRef = useRef(null);

    // Safely encode the initial HTML to prevent script breaking due to quotes/newlines
    const safeInitialContent = encodeURIComponent(value || "");

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <script src="https://cdn.ckeditor.com/ckeditor5/40.0.0/classic/ckeditor.js"></script>
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    background-color: #fff; 
                    font-family: sans-serif;
                }
                /* Hide the CKEditor branding warning if necessary */
                .ck-powered-by { display: none !important; }
                /* Set minimum height and remove focus borders */
                .ck-editor__editable_inline { 
                    min-height: ${height - 50}px; 
                    border: none !important;
                    box-shadow: none !important;
                }
                .ck.ck-editor__main>.ck-editor__editable:not(.ck-focused) {
                    border-color: transparent !important;
                }
            </style>
        </head>
        <body>
            <div id="editor"></div>
            <script>
                ClassicEditor
                    .create(document.querySelector('#editor'), {
                        toolbar: ['heading', '|', 'bold', 'italic', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo']
                    })
                    .then(editor => {
                        // Decode and set initial data
                        const initialData = decodeURIComponent('${safeInitialContent}');
                        editor.setData(initialData);

                        // Listen for content changes and send to React Native
                        editor.model.document.on('change:data', () => {
                            const data = editor.getData();
                            window.ReactNativeWebView.postMessage(data);
                        });
                    })
                    .catch(error => {
                        console.error(error);
                    });
            </script>
        </body>
        </html>
    `;

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                onMessage={(event) => {
                    // Receive data from the WebView script
                    if (onChange) {
                        onChange(event.nativeEvent.data);
                    }
                }}
                scrollEnabled={false}
                bounces={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#fff",
    },
});

export default CKEditor;
