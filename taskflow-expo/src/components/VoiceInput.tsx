import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  onClose: () => void;
}

export function VoiceInput({ onResult, onClose }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation while recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Toestemming vereist',
          'Geef toegang tot de microfoon om spraakherkenning te gebruiken.',
          [
            { text: 'Annuleren', style: 'cancel' },
            { text: 'Handmatig invoeren', onPress: () => setShowManualInput(true) },
          ]
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setTranscript('Luisteren...');

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert(
        'Spraakherkenning niet beschikbaar',
        'Gebruik handmatige invoer om je taak of event toe te voegen.',
        [
          { text: 'OK', onPress: () => setShowManualInput(true) },
        ]
      );
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setTranscript('Verwerken...');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Note: Expo Go doesn't include speech-to-text natively
      // In a production app, you would send the audio to a transcription service
      // For now, we'll show the manual input option

      Alert.alert(
        'Audio opgenomen',
        'Spraak-naar-tekst vereist een externe service. Gebruik handmatige invoer of typ wat je hebt gezegd.',
        [
          {
            text: 'Handmatig invoeren',
            onPress: () => {
              setShowManualInput(true);
              setTranscript('');
            }
          },
        ]
      );

    } catch (err) {
      console.error('Failed to stop recording', err);
      setTranscript('');
    }

    recordingRef.current = null;
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onResult(manualInput.trim());
    }
  };

  const examplePhrases = [
    'Vergadering met team morgen om 10 uur',
    'Boodschappen doen voor het weekend',
    'Rapport afmaken vrijdag urgent',
    'Tandarts afspraak volgende week dinsdag',
    'Project presentatie voorbereiden werk',
  ];

  const useExample = (phrase: string) => {
    setManualInput(phrase);
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <Text style={styles.title}>Spraakherkenning</Text>
          <Text style={styles.subtitle}>
            {showManualInput
              ? 'Typ je taak of event in natuurlijke taal'
              : 'Tik op de microfoon om te beginnen'
            }
          </Text>

          {!showManualInput ? (
            <>
              {/* Microphone Button */}
              <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                  style={[styles.micButton, isRecording && styles.micButtonRecording]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <LinearGradient
                    colors={isRecording ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
                    style={styles.micGradient}
                  >
                    <Ionicons
                      name={isRecording ? 'stop' : 'mic'}
                      size={40}
                      color="#fff"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Status Text */}
              {transcript && (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}

              {/* Manual Input Toggle */}
              <TouchableOpacity
                style={styles.manualButton}
                onPress={() => setShowManualInput(true)}
              >
                <Ionicons name="create-outline" size={20} color="#6366f1" />
                <Text style={styles.manualButtonText}>Of typ handmatig</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Manual Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Bijv: Vergadering met team morgen om 14:00 werk"
                placeholderTextColor="#6b7280"
                value={manualInput}
                onChangeText={setManualInput}
                multiline
                autoFocus
              />

              {/* Example Phrases */}
              <Text style={styles.examplesTitle}>Voorbeelden:</Text>
              <View style={styles.examples}>
                {examplePhrases.map((phrase, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.exampleChip}
                    onPress={() => useExample(phrase)}
                  >
                    <Text style={styles.exampleText} numberOfLines={1}>
                      {phrase}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, !manualInput.trim() && styles.submitButtonDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualInput.trim()}
              >
                <Text style={styles.submitButtonText}>Toevoegen</Text>
              </TouchableOpacity>

              {/* Back to voice */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowManualInput(false)}
              >
                <Ionicons name="mic-outline" size={20} color="#6366f1" />
                <Text style={styles.backButtonText}>Terug naar spraak</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips voor invoer:</Text>
            <Text style={styles.tipText}>• Gebruik "morgen", "volgende week" voor datums</Text>
            <Text style={styles.tipText}>• Voeg "werk" of "privé" toe voor categorie</Text>
            <Text style={styles.tipText}>• Gebruik "urgent" of "belangrijk" voor prioriteit</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  micContainer: {
    marginBottom: 24,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  micButtonRecording: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  micGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  transcriptText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  manualButtonText: {
    color: '#6366f1',
    fontSize: 14,
  },
  textInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    width: '100%',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  examplesTitle: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'flex-start',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  exampleChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '100%',
  },
  exampleText: {
    color: '#6366f1',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 14,
  },
  tips: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
});
