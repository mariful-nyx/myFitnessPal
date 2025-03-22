import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';

import Quickstart from '../components/WorkoutTracker/Quickstart';
import Exercise from '../components/WorkoutTracker/Exercise';

const WorkoutTracker = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, currentTab === 0 && styles.activeTab]}
            onPress={() => setCurrentTab(0)}
          >
            <Text style={[styles.tabText, currentTab === 0 && styles.activeTabText]}>
              Workout Log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentTab === 1 && styles.activeTab]}
            onPress={() => setCurrentTab(1)}
          >
            <Text style={[styles.tabText, currentTab === 1 && styles.activeTabText]}>
              Exercise List
            </Text>
          </TouchableOpacity>
        </View>

        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#6c63ff' },
          }}
          style={styles.calendar}
        />

        {currentTab === 0 ? (
          <Quickstart date={selectedDate} />
        ) : (
          <Exercise date={selectedDate} />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tab: {
    backgroundColor: '#e6e6e6',
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: '#6c63ff',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  tabText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default WorkoutTracker;
