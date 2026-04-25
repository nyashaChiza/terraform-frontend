import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { startSession, completeSession, addFeedback } from '../../services/sessions';
import { showError, showSuccess } from '../../services/toast';
import FeedbackSheet from '../../components/FeedbackSheet';

type Exercise = {
  exercise_id: number;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes: string;
};

type Session = {
  id: number;
  planned_session_id: number;
  started_date: string;
  completed_date: boolean;
  status: string; // PLANNED, STARTED, COMPLETED
  created: string;
  updated: string;
  title: string;
  duration?: string;
  exercises: any[];
  plan_payload?: {
    title: string;
    summary: string;
    goal_progress_feedback: string;
    estimated_duration_minutes: number;
    intensity: string;
    exercises: Exercise[];
  };
  summary?: string;
  intensity?: string;
  goal_progress_feedback?: string;
  feedback?: {
    soreness_per_muscle: Record<string, number>;
    joint_pain: boolean;
    effort_rating: number;
    energy_level: number;
    summary: string;
    id: number;
    logged_session_id: number;
    created: string;
    updated: string;
  };
};

export default function SessionDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session: sessionParam } = useLocalSearchParams<{ session: string }>();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (sessionParam) {
      try {
        const parsedSession = JSON.parse(sessionParam);
        setSession(parsedSession);
      } catch (err) {
        console.error('Failed to parse session:', err);
      }
    }
  }, [sessionParam]);

  const [startingSession, setStartingSession] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [feedbackSheetVisible, setFeedbackSheetVisible] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleStartSession = async () => {
    setStartingSession(true);
    try {
      const result = await startSession(session.id);

      if (result.ok) {
        // Update the session with the response
        setSession({ ...session, ...result.body, status: 'STARTED' });
        showSuccess('Session Started', 'Your workout session has begun. Good luck! 💪');
      } else {
        console.error('Failed to start session:', result.body);
        showError('Failed to Start', 'Could not start the session. Please try again.');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      showError('Error', 'An unexpected error occurred while starting the session.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleCompleteSession = async () => {
    setCompletingSession(true);
    try {
      const result = await completeSession(session.id);

      if (result.ok) {
        // Update the session with the response
        setSession({ ...session, ...result.body, status: 'COMPLETED', completed: true });
        showSuccess('Session Completed', 'Great work! Your session has been completed. 🎉');
      } else {
        console.error('Failed to complete session:', result.body);
        showError('Failed to Complete', 'Could not complete the session. Please try again.');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      showError('Error', 'An unexpected error occurred while completing the session.');
    } finally {
      setCompletingSession(false);
    }
  };

  const handleAddFeedback = () => {
    // Only show feedback sheet if session is completed and doesn't already have feedback
    if (isCompleted) {
      setFeedbackSheetVisible(true);
    }
  };

  const handleSubmitFeedback = async (feedback: any) => {
    try {
      const result = await addFeedback(session.id, feedback);
      
      if (result.ok) {
        // Update session with new feedback
        setSession({ ...session, feedback: result.body });
        return result;
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      throw error;
    }
  };

  if (!session) {
    return (
      <View className="flex-1 bg-violet-700 px-5 justify-center items-center">
        <Text className="text-white text-lg">Loading session details...</Text>
      </View>
    );
  }

  const isCompleted = session.completed_at || session.status === 'COMPLETED';
  const isStarted = session.status === 'STARTED';
  const isPlanned = session.status === 'PLANNED' || (!session.status && !session.completed_at);
  const sessionDate = new Date(session.started_date || session.created);
  const hasFeedback = session.feedback != null;
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Get data from plan_payload or fallback to top-level properties
  const summary = session.plan_payload?.summary || session.summary;
  const intensity = session.plan_payload?.intensity || session.intensity;
  const goalFeedback = session.plan_payload?.goal_progress_feedback || session.goal_progress_feedback;
  const exercises = session.plan_payload?.exercises || session.exercises || [];
  const estimatedDuration = session.plan_payload?.estimated_duration_minutes;

  // Extract unique muscle groups from exercises for feedback
  const muscleGroups = Array.from(
    new Set(
      exercises
        .map((ex: any) => ex.muscle_group)
        .filter((mg: string) => mg)
    )
  ) as string[];

  return (
    <View className="flex-1 bg-violet-700">
      <ScrollView className="flex-1 px-5" style={{ paddingTop: insets.top + 16 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-3xl font-extrabold flex-1">
            {session.plan_payload?.title || session.title || `Session #${session.id}`}
          </Text>
          <Pressable onPress={handleBack} className="p-2">
            <Text className="text-white text-2xl">✕</Text>
          </Pressable>
        </View>

        {/* Session Meta Info */}
        <View className="flex-row items-center gap-3 mb-4">
          {intensity && (
            <View className="bg-violet-600 px-3 py-1 rounded-full">
              <Text className="text-violet-100 text-xs font-semibold">
                {intensity}
              </Text>
            </View>
          )}
          {estimatedDuration && (
            <Text className="text-violet-200 text-sm">
              ⏱ {estimatedDuration} min
            </Text>
          )}
          {exercises.length > 0 && (
            <Text className="text-violet-200 text-sm">
              {exercises.length} exercises
            </Text>
          )}
          <Text className={`text-sm font-semibold ${isCompleted ? 'text-green-300' : isStarted ? 'text-yellow-300' : 'text-blue-300'}`}>
            {isCompleted ? '✓ Completed' : isStarted ? '▶ In Progress' : '○ Planned'}
          </Text>
        </View>

        {/* Summary Section */}
        {summary && (
          <View className="bg-white rounded-3xl p-5 mb-4">
            <Text className="text-xs text-gray-400 uppercase mb-2">Workout Summary</Text>
            <Text className="text-gray-700 text-base leading-6">{summary}</Text>
          </View>
        )}

        {/* Goal Progress Feedback */}
        {goalFeedback && (
          <View className="mb-4 bg-violet-600/50 rounded-2xl p-4 border border-violet-500/30">
            <Text className="text-violet-200 text-xs uppercase font-semibold mb-2">
              💪 Progress Note
            </Text>
            <Text className="text-white text-sm leading-5">
              {goalFeedback}
            </Text>
          </View>
        )}

        {/* Session Info Card */}
        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-xs text-gray-400 uppercase mb-3">Session Details</Text>

          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Date</Text>
              <Text className="font-semibold text-gray-800">{formattedDate}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Time</Text>
              <Text className="font-semibold text-gray-800">{formattedTime}</Text>
            </View>
            {(session.duration || estimatedDuration) && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Duration</Text>
                <Text className="font-semibold text-gray-800">
                  {session.duration || `${estimatedDuration} min`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Exercises Section */}
        {exercises.length > 0 && (
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-4">Exercises</Text>
            
            {exercises.map((exercise, index) => (
              <View 
                key={exercise.exercise_id || index} 
                className="bg-white rounded-2xl p-5 mb-3"
              >
                {/* Exercise Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View className="bg-violet-100 w-7 h-7 rounded-full items-center justify-center">
                        <Text className="text-violet-700 font-bold text-sm">
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="text-violet-900 text-lg font-bold flex-1">
                        {exercise.name || `Exercise ${index + 1}`}
                      </Text>
                    </View>
                    {exercise.muscle_group && (
                      <Text className="text-violet-600 text-xs font-semibold uppercase ml-9">
                        {exercise.muscle_group}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Sets & Reps */}
                {(exercise.sets || exercise.reps || exercise.rest_seconds) && (
                  <View className="flex-row gap-3 mb-3">
                    {exercise.sets && (
                      <View className="flex-1 bg-violet-50 rounded-xl p-3">
                        <Text className="text-violet-600 text-xs font-semibold mb-1">
                          Sets
                        </Text>
                        <Text className="text-violet-900 text-2xl font-bold">
                          {exercise.sets}
                        </Text>
                      </View>
                    )}
                    {exercise.reps && (
                      <View className="flex-1 bg-violet-50 rounded-xl p-3">
                        <Text className="text-violet-600 text-xs font-semibold mb-1">
                          Reps
                        </Text>
                        <Text className="text-violet-900 text-2xl font-bold">
                          {exercise.reps}
                        </Text>
                      </View>
                    )}
                    {exercise.rest_seconds && (
                      <View className="flex-1 bg-violet-50 rounded-xl p-3">
                        <Text className="text-violet-600 text-xs font-semibold mb-1">
                          Rest
                        </Text>
                        <Text className="text-violet-900 text-2xl font-bold">
                          {exercise.rest_seconds}s
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Notes */}
                {exercise.notes && (
                  <View className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <Text className="text-amber-900 text-xs font-semibold mb-1">
                      💡 Form Tip
                    </Text>
                    <Text className="text-amber-800 text-sm">
                      {exercise.notes}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Feedback Section */}
        {isCompleted && hasFeedback && (
          <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-4">Session Feedback</Text>

            {/* Effort & Energy */}
            <View className="bg-white rounded-2xl p-4 mb-3">
              <Text className="text-xs text-gray-400 uppercase mb-3">Performance</Text>
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700 font-semibold">Effort Rating</Text>
                  <View className="flex-row items-center">
                    <Text className="text-2xl font-bold text-violet-800">{session.feedback.effort_rating}</Text>
                    <Text className="text-gray-400 ml-1">/5</Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700 font-semibold">Energy Level</Text>
                  <View className="flex-row items-center">
                    <Text className="text-2xl font-bold text-violet-800">{session.feedback.energy_level}</Text>
                    <Text className="text-gray-400 ml-1">/5</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Soreness & Pain */}
            {Object.keys(session.feedback.soreness_per_muscle || {}).length > 0 && (
              <View className="bg-white rounded-2xl p-4 mb-3">
                <Text className="text-xs text-gray-400 uppercase mb-3">Muscle Soreness</Text>
                {Object.entries(session.feedback.soreness_per_muscle).map(([muscle, soreness]) => (
                  <View key={muscle} className="flex-row justify-between mb-2">
                    <Text className="text-gray-700 capitalize">{muscle}</Text>
                    <Text className="font-semibold text-gray-800">{soreness}/5</Text>
                  </View>
                ))}
              </View>
            )}

            {session.feedback.joint_pain && (
              <View className="bg-red-50 rounded-2xl p-4 mb-3 border border-red-200">
                <Text className="text-red-700 font-semibold">⚠ Joint Pain Reported</Text>
              </View>
            )}

            {session.feedback.summary && (
              <View className="bg-white rounded-2xl p-4 mb-3">
                <Text className="text-xs text-gray-400 uppercase mb-2">Feedback Summary</Text>
                <Text className="text-gray-700 leading-6">{session.feedback.summary}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {isPlanned && (
          <Pressable 
            className="bg-white py-4 rounded-2xl items-center mb-3"
            onPress={handleStartSession}
            disabled={startingSession}
          >
            {startingSession ? (
              <Text className="text-violet-700 font-extrabold text-lg">Starting...</Text>
            ) : (
              <Text className="text-violet-700 font-extrabold text-lg">Start Session</Text>
            )}
          </Pressable>
        )}

        {isStarted && (
          <Pressable 
            className="bg-white py-4 rounded-2xl items-center mb-3"
            onPress={handleCompleteSession}
            disabled={completingSession}
          >
            {completingSession ? (
              <Text className="text-violet-700 font-extrabold text-lg">Completing...</Text>
            ) : (
              <Text className="text-violet-700 font-extrabold text-lg">Complete Session</Text>
            )}
          </Pressable>
        )}

        {isCompleted && session.feedback == null && (
          <Pressable 
            className="bg-white py-4 rounded-2xl items-center mb-3"
            onPress={handleAddFeedback}
          >
            <Text className="text-violet-700 font-extrabold text-lg">Add Feedback</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleBack}
          className="bg-white/20 py-4 rounded-2xl items-center mb-10"
        >
          <Text className="text-white font-semibold text-base">Go Back</Text>
        </Pressable>
      </ScrollView>

      {/* Feedback Sheet */}
      <FeedbackSheet
        visible={feedbackSheetVisible}
        muscleGroups={muscleGroups}
        onClose={() => setFeedbackSheetVisible(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </View>
  );
}