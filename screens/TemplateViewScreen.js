import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';




const TemplateViewScreen = ({route}) => {
    const {name} = route.params
    const navigation = useNavigation()
    
    const exercises = [
      '3 * Squat (Barball)',
      '3 * Leg extension (Machine)',
      '2 * Flat leg raise',
      '3 * Standing calf raisa (Dumbbel)'
    ]
    
  return (
    <SafeAreaView style={{flex:1, paddingHorizontal: 20, backgroundColor: 'white'}}>
      <View style={{marginTop: 20}}>
        <Text style={{fontSize: 35, fontWeight: 'bold'}}>{name}</Text>
        <Text style={{marginTop: 8, fontSize: 16, color: 'gray', fontWeight: 'bold'}}>Last Performed: never</Text>
      </View>
      <ScrollView style={{marginTop: 30}}>
        <View style={{gap: 20, paddingLeft: 20}}>
          {exercises.map((item, index)=>(
            <View key={index} style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <View>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>{item}</Text>
                <Text>{name}</Text>
              </View>

              <TouchableOpacity onPress={()=>navigation.navigate('ExerciseView', {name: 'Push up'})}>
                <AntDesign name="question" size={24} color="black" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{marginBottom: 30}}>
        <TouchableOpacity onPress={()=>navigation.navigate('StartWorkout', {name: 'Leg'})} style={styles.addButton}>
          <Text style={styles.addButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>

 
    </SafeAreaView>
  )
}

export default TemplateViewScreen

const styles = StyleSheet.create({
  addButton: { backgroundColor: '#6c63ff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

})