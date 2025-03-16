import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ExerciseViewScreen = ({route}) => {
    const {name} = route.params
  return (
    <View>
      <Text>ExerciseViewScreen {name}</Text>
    </View>
  )
}

export default ExerciseViewScreen

const styles = StyleSheet.create({})