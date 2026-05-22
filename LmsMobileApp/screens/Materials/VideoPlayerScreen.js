import React, { useState, useRef, useEffect } from "react";
import { 
    View, 
    StyleSheet, 
    Text, 
    useWindowDimensions, 
    TouchableWithoutFeedback,
    StatusBar,
    Animated,
    ActivityIndicator
} from "react-native";
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Slider from "@react-native-community/slider";

const VideoPlayerScreen = ({ route }) => {
    const { videoUrl } = route.params || {};
    const { width, height } = useWindowDimensions();
    const navigation = useNavigation();
    
    // --- Video Player Initialization (expo-video) ---
    const player = useVideoPlayer(videoUrl, (p) => {
        p.loop = false; // Disable loop for lessons
        p.play();       // Auto-play on mount
    });

    // Listen to native events from expo-video
    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const { status } = useEvent(player, 'statusChange', { status: player.status });
    
    const isBuffering = status === 'loading';

    // --- UI and Playback States ---
    const [isRotated, setIsRotated] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    
    // Progress States (expo-video uses seconds instead of milliseconds)
    const [positionSec, setPositionSec] = useState(0);
    const [durationSec, setDurationSec] = useState(0);
    const [isSliding, setIsSliding] = useState(false);

    // Animation Value for fading controls
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const controlsTimer = useRef(null);

    // Auto-hide controls after 3 seconds of inactivity
    const startControlsTimer = () => {
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            if (isPlaying && !isSliding) hideControls();
        }, 3000);
    };

    const showControls = () => {
        setControlsVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
        startControlsTimer();
    };

    const hideControls = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setControlsVisible(false));
    };

    // Initialize timer on mount & Sync slider position
    useEffect(() => {
        startControlsTimer();
        
        // Poll the current time since expo-video doesn't have an intense onPlaybackStatusUpdate prop
        let interval;
        if (isPlaying && !isSliding) {
            interval = setInterval(() => {
                setPositionSec(player.currentTime);
                setDurationSec(player.duration);
            }, 500); // Update slider every 500ms
        }

        return () => {
            if (controlsTimer.current) clearTimeout(controlsTimer.current);
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, isSliding, player]);

    // Fallback UI
    if (!videoUrl) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Video source not found.</Text>
                <IconButton 
                    icon="arrow-left" 
                    iconColor="#ffffff" 
                    containerColor="rgba(255,255,255,0.15)"
                    size={30} 
                    onPress={() => navigation.goBack()} 
                />
            </View>
        );
    }

    // --- Interaction Handlers ---
    const handleToggleRotate = () => {
        setIsRotated(!isRotated);
        showControls();
    };

    const handleScreenTap = () => {
        if (controlsVisible) {
            if (isPlaying) {
                player.pause();
            } else {
                player.play();
                startControlsTimer();
            }
        } else {
            showControls();
        }
    };

    // --- Slider Handlers ---
    const handleSlidingStart = () => {
        setIsSliding(true);
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };

    const handleSlidingComplete = (value) => {
        player.currentTime = value; // Seek video to new position
        setIsSliding(false);
        setPositionSec(value);
        startControlsTimer();
    };

    // Helper: Formats seconds to MM:SS
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    // Dynamic styles for screen rotation simulation
    const dynamicVideoStyle = isRotated
        ? {
            width: height,
            height: width,
            transform: [{ rotate: "90deg" }],
          }
        : {
            width: width,
            height: "100%",
          };

    return (
        <View style={styles.container}>
            <StatusBar hidden={true} />

            <TouchableWithoutFeedback onPress={handleScreenTap}>
                <View style={styles.videoWrapper}>
                    <VideoView
                        style={[styles.backgroundVideo, dynamicVideoStyle]}
                        player={player}
                        nativeControls={false} // Disable native UI to use our custom HUD
                        contentFit="contain"   // Replaces resizeMode in expo-video
                    />
                    
                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <View style={styles.hudOverlay} pointerEvents="none">
                            <ActivityIndicator size="large" color="#ffffff" />
                        </View>
                    )}

                    {/* Minimalist Pause HUD */}
                    {!isPlaying && !isBuffering && (
                        <View style={styles.hudOverlay} pointerEvents="none">
                            <IconButton icon="play" iconColor="#ffffff" size={64} />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* Animated Control Layer */}
            <Animated.View 
                style={[styles.controlsOverlay, { opacity: fadeAnim }]}
                pointerEvents={controlsVisible ? "box-none" : "none"}
            >
                {/* Top Layer: Back Button */}
                <View style={styles.topControlBar}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#ffffff"
                        containerColor="rgba(0, 0, 0, 0.4)"
                        size={26}
                        onPress={() => {
                            player.pause(); // Ensure video stops when leaving
                            navigation.goBack();
                        }}
                    />
                </View>

                {/* Bottom Layer: Progress Bar, Timers, and Rotate Button */}
                <View style={styles.bottomControlBar}>
                    <Text style={styles.timeText}>{formatTime(positionSec)}</Text>
                    
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={durationSec || 1} 
                        value={positionSec}
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                        minimumTrackTintColor="#4f46e5"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#ffffff"
                    />
                    
                    <Text style={styles.timeText}>{formatTime(durationSec)}</Text>

                    <IconButton
                        icon={isRotated ? "screen-rotation-lock" : "screen-rotation"}
                        iconColor="#ffffff"
                        size={24}
                        style={styles.rotateButton}
                        onPress={handleToggleRotate}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
    },
    videoWrapper: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    backgroundVideo: {
        backgroundColor: "#000000",
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        justifyContent: "space-between", 
    },
    topControlBar: {
        paddingTop: 20,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    bottomControlBar: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.4)", 
    },
    timeText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "600",
        fontVariant: ["tabular-nums"], 
    },
    slider: {
        flex: 1,
        marginHorizontal: 12,
        height: 40,
    },
    rotateButton: {
        margin: 0,
        marginLeft: 8,
    },
    hudOverlay: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)", 
        borderRadius: 60,
        width: 100,
        height: 100,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
    },
    errorText: {
        fontSize: 16,
        color: "#ef4444",
        fontWeight: "bold",
        marginBottom: 24,
    },
});

export default VideoPlayerScreen;
