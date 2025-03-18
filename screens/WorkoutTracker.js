import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
} from 'react-native';

import Quickstart from '../components/WorkoutTracker/Quickstart';
import Exercise from '../components/WorkoutTracker/Exercise';



const WorkoutTracker = ({navigation}) => {
  const [currentTab, setCurrentTab] = useState(0)


  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.tabs}>

          <TouchableOpacity style={[styles.tab, currentTab ===0 && {backgroundColor: '#6c63ff'}]} onPress={()=>setCurrentTab(0)}>
            <Text style={currentTab ===0 && {color: 'white'}}>Quick STart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.tab, currentTab ===1 && {backgroundColor: '#6c63ff'}]} onPress={()=>setCurrentTab(1)}>
            <Text style={currentTab === 1 && {color: 'white'}}>Exercise</Text>
          </TouchableOpacity>

        </View>

        {currentTab === 0 ? (
          <Quickstart navigation={navigation}/>
        ):(
          <Exercise navigation={navigation}/>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', overflow: 'scroll', paddingBottom: 50, marginTop:20 },
  tabs: {flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20},
  tab: {backgroundColor: '#e6e6e6', paddingVertical: 10, width: '48%', display: 'flex', alignItems: 'center', borderRadius: 5, },
 

});

export default WorkoutTracker;
