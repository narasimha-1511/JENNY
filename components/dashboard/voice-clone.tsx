'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icons';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceCloneCredentials {
  id: number;
  api_key: string;
  model_id: string;
  voice_id: string;
  provider: string;
  settings: any;
  is_active: boolean;
  quota_limit: number;
  quota_used: number;
}

interface Recording {
  id: string;
  recording_name: string;
  recording_path: string;
  recording_url: string;
  duration: number;
  created_at: string;
  status: string;
  processed_url: string | null;
  storage_path: string;
  file_size: number;
  mime_type: string;
  metadata: {
    original_filename: string;
    uploaded_at: string;
  };
}

export function VoiceClone() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<VoiceCloneCredentials | null>(null);
  const [newCredentials, setNewCredentials] = useState({
    api_key: '',
    model_id: '',
    voice_id: '',
    settings: {}
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadRecordings();
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_clone_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading credentials:', error);
        setError('Failed to load voice clone credentials');
        return;
      }

      setCredentials(data);
    } catch (error) {
      console.error('Error loading credentials:', error);
      setError('Failed to load voice clone credentials');
    }
  };

  const saveCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, deactivate any existing active credentials
      const { error: deactivateError } = await supabase
        .from('voice_clone_credentials')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating old credentials:', deactivateError);
      }

      // Insert new credentials
      const { data, error: insertError } = await supabase
        .from('voice_clone_credentials')
        .insert({
          user_id: user.id,
          api_key: newCredentials.api_key,
          model_id: newCredentials.model_id,
          voice_id: newCredentials.voice_id,
          provider: 'elevenlabs', // default provider
          settings: newCredentials.settings,
          is_active: true,
          quota_limit: 0, // Set appropriate default or make it configurable
          quota_used: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCredentials(data);
      setShowCredentialsDialog(false);
      setError(null);
      
      // Reset form
      setNewCredentials({
        api_key: '',
        model_id: '',
        voice_id: '',
        settings: {}
      });
    } catch (error) {
      console.error('Error saving credentials:', error);
      setError('Failed to save credentials');
    }
  };

  const updateQuotaUsage = async (credentialId: string, additionalUsage: number) => {
    try {
      const { error } = await supabase
        .from('voice_clone_credentials')
        .update({ 
          quota_used: credentials ? credentials.quota_used + additionalUsage : additionalUsage 
        })
        .eq('id', credentialId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quota usage:', error);
    }
  };

  const loadRecordings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get signed URLs for each recording
      const recordingsWithUrls = await Promise.all((data || []).map(async (recording) => {
        if (recording.recording_path) {
          const { data: signedUrl } = await supabase
            .storage
            .from('voice-recordings')
            .createSignedUrl(recording.recording_path, 3600); // 1 hour expiry

          return {
            ...recording,
            recording_url: signedUrl?.signedUrl || recording.recording_url
          };
        }
        return recording;
      }));

      setRecordings(recordingsWithUrls);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setError('Failed to load recordings');
    }
  };

  const handleUploadRecording = async (audioBlob: Blob) => {
    if (!recordingName) {
      setError('Please enter a recording name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create a unique filename
      const timestamp = new Date().getTime();
      const filename = `${timestamp}-${recordingName.replace(/\s+/g, '-')}.wav`;
      const storagePath = `${user.id}/${filename}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(storagePath, audioBlob, {
          contentType: 'audio/wav',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('voice-recordings')
        .getPublicUrl(storagePath);

      if (urlError) throw urlError;

      // Insert record into database with processed status
      const { data: recordingData, error: dbError } = await supabase
        .from('voice_recordings')
        .insert({
          user_id: user.id,
          recording_name: recordingName,
          recording_url: publicUrl,
          recording_path: storagePath,
          file_size: audioBlob.size,
          mime_type: 'audio/wav',
          status: 'processed', // Set to processed since we can play it
          duration: 0 // We'll update this after loading the audio
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Get audio duration
      const audio = new Audio(publicUrl);
      audio.addEventListener('loadedmetadata', async () => {
        const { error: updateError } = await supabase
          .from('voice_recordings')
          .update({ duration: audio.duration })
          .eq('id', recordingData.id);

        if (updateError) {
          console.error('Error updating duration:', updateError);
        }

        // Update local state with duration
        setRecordings(prev => prev.map(rec => 
          rec.id === recordingData.id 
            ? { ...rec, duration: audio.duration }
            : rec
        ));
      });

      setRecordings(prev => [recordingData, ...prev]);
      setRecordingName('');
      setError(null);
    } catch (error) {
      console.error('Error uploading recording:', error);
      setError('Failed to upload recording');
    }
  };

  const updateRecordingStatus = async (recordingId: string, status: 'pending' | 'processed' | 'failed') => {
    try {
      const { error } = await supabase
        .from('voice_recordings')
        .update({ status })
        .eq('id', recordingId);

      if (error) throw error;

      // Update local state
      setRecordings(prev => prev.map(rec => 
        rec.id === recordingId 
          ? { ...rec, status }
          : rec
      ));
    } catch (error) {
      console.error('Error updating recording status:', error);
    }
  };

  useEffect(() => {
    recordings.forEach(recording => {
      if (recording.status === 'pending' && recording.recording_url) {
        const audio = new Audio(recording.recording_url);
        audio.addEventListener('canplaythrough', () => {
          updateRecordingStatus(recording.id, 'processed');
        });
        audio.addEventListener('error', () => {
          updateRecordingStatus(recording.id, 'failed');
        });
      }
    });
  }, [recordings]);

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      const recording = recordings.find(r => r.id === recordingId);
      if (!recording) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('voice-recordings')
        .remove([recording.recording_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('voice_recordings')
        .delete()
        .eq('id', recordingId);

      if (dbError) throw dbError;

      // Update UI
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
    } catch (error) {
      console.error('Error deleting recording:', error);
      setError('Failed to delete recording');
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleUploadRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Add audio player state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = async (recordingId: string, storagePath: string) => {
    try {
      if (currentlyPlaying === recordingId) {
        audioRef.current?.pause();
        setCurrentlyPlaying(null);
        return;
      }

      // Get a fresh signed URL
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('voice-recordings')
        .createSignedUrl(storagePath, 3600);

      if (urlError) throw urlError;
      if (!signedUrl?.signedUrl) throw new Error('Failed to get signed URL');

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(signedUrl.signedUrl);
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setCurrentlyPlaying(null);
        setError('Failed to play recording');
      };

      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };

      await audioRef.current.play();
      setCurrentlyPlaying(recordingId);
    } catch (error) {
      console.error('Error playing recording:', error);
      setError('Failed to play recording');
      setCurrentlyPlaying(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Voice Clone</h2>
        <Button
          onClick={() => setShowCredentialsDialog(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Icon name="settings" className="h-4 w-4" />
          API Settings
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!credentials && (
        <Alert>
          <AlertDescription>
            Please configure your voice clone API credentials to start using this feature.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Record or Upload Voice</CardTitle>
          <CardDescription>
            Record your voice or upload an audio file to create a voice clone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="text"
                placeholder="Recording name"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                <Icon name={isRecording ? "square" : "mic"} className="h-4 w-4" />
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('audioUpload')?.click()}
                >
                  <Icon name="upload" className="h-4 w-4" />
                  Upload Audio
                </Button>
                <input
                  id="audioUpload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleUploadRecording(e.target.files![0])}
                />
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.map((recording) => (
          <Card key={recording.id} className="w-full">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{recording.recording_name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(recording.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {recording.recording_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlayPause(recording.id, recording.recording_path)}
                      >
                        <Icon
                          name={currentlyPlaying === recording.id ? "square" : "play"}
                          className="h-4 w-4"
                        />
                        <span className="sr-only">
                          {currentlyPlaying === recording.id ? "Stop" : "Play"}
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRecording(recording.id)}
                    >
                      <Icon name="trash" className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <p>Status: <span className="capitalize">{recording.status}</span></p>
                  {recording.duration && (
                    <p>Duration: {Math.round(recording.duration)}s</p>
                  )}
                  {recording.file_size && (
                    <p>Size: {Math.round(recording.file_size / 1024)} KB</p>
                  )}
                </div>
                {recording.status === 'pending' && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full w-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Audio element for accessibility */}
      <audio
        id="audio-player"
        className="hidden"
        controls
        onEnded={() => setCurrentlyPlaying(null)}
      />
    </div>
  );
}
