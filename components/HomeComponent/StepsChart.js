import { Text, StyleSheet, View, Dimensions, TouchableOpacity } from "react-native";
import React, { Component, useEffect, useState } from "react";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { BarChart as BarChartRNG } from "react-native-gifted-charts";
import moment from "moment/moment";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { get, getDatabase, ref, set } from "firebase/database";



const screenWidth = Dimensions.get("window").width;

export const getWidthSpace = (chartTypeIndex) => {
  let barWidth = 0;
  let spacing = 0;

  // for days
  if (chartTypeIndex === 0) {
    barWidth = 15;
    spacing = 12;
    return { barWidth: barWidth, spacing: spacing };
  } else if (chartTypeIndex === 1) {
    // for weeks
    barWidth = 25;
    spacing = 20;
    return { barWidth: barWidth, spacing: spacing };
  } else if (chartTypeIndex === 2) {
    // for per month
    barWidth = 5;
    spacing = 5;
    return { barWidth: barWidth, spacing: spacing };
  } else if (chartTypeIndex === 3) {
    // for 6 months
    barWidth = 25;
    spacing = 22;
    return { barWidth: barWidth, spacing: spacing };
  } else if (chartTypeIndex === 4) {
    // for one year
    barWidth = 15;
    spacing = 10;
    return { barWidth: barWidth, spacing: spacing };
  }
};

export function getWeekday(date) {
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayIndex = new Date(date).getDay(); // getDay() returns a number between 0 (Sunday) and 6 (Saturday)
  return daysOfWeek[dayIndex];
}

export const formatMonth = (month) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[parseInt(month.split('-')[1], 10) - 1]; // Extract the month and map it to the abbreviation
};



export default function StepsChart({ data, refresh }) {
  const navigation = useNavigation()

  const date = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(date);

  const [selectedIndexStep, setSelectedIndexStep] = useState(0);
  const [steps, setSteps] = useState();


  useEffect(()=>{

    if(data){
      const newSteps = data[selectedDate]?.map(item => ({
        value: item.steps,
        label: moment(item.timestamp).format('ha')
      }));
    
      setSteps({0: newSteps });
    }

  }, [data])

  useEffect(() => {
    if(data){

      const stepsPerDayAcc = [];
      const stepsPerWeekDayAcc = []
      const stepsPerMonthAcc = {}; // To accumulate steps per month

      // Iterate through the data
      for (let date in data) {
        const records = data[date];
        let totalSteps = 0;
        let count = 0;

        records.forEach(record => {
          if (record) {
            totalSteps += record.steps;
            count++;
          }
        });

        // Calculate the average steps per day
        const averageSteps = count > 0 ? totalSteps / count : 0;

        // Push the result as an object into the array
        stepsPerDayAcc.push({
          value: Math.floor(averageSteps),
          label: date // Use Math.round, Math.ceil, or Math.floor as needed
        })

        stepsPerWeekDayAcc.push({
          value: Math.floor(averageSteps),
          label: getWeekday(date)  // Use Math.round, Math.ceil, or Math.floor as needed
        });
      
         // Calculate total steps per month
        const month = date.substring(0, 7); // Extract the month in "YYYY-MM" format (adjust as needed)
        if (!stepsPerMonthAcc[month]) {
          stepsPerMonthAcc[month] = { totalSteps: 0, count: 0 };
        }
        stepsPerMonthAcc[month].totalSteps += totalSteps;
        stepsPerMonthAcc[month].count += count;
      
      }

      

     
      
  
      // Calculate the average steps per month
      const stepsPerMonth = [];
      for (let month in stepsPerMonthAcc) {
        const { totalSteps, count } = stepsPerMonthAcc[month];
        const averageSteps = count > 0 ? totalSteps / count : 0;
        stepsPerMonth.push({
          value: Math.floor(averageSteps),
          label: formatMonth(month) // Month in "YYYY-MM" format
        });
      }
  

      // Update the state with the calculated steps data
      setSteps((prev)=>({...prev, 1: stepsPerWeekDayAcc, 2: stepsPerDayAcc, 3: stepsPerMonth.slice(0, 5), 4: stepsPerMonth }));
    }

  }, [data]);


  const handleAddStep = () => {
    navigation.navigate('AddData', {name: 'Steps', refresh: refresh })
  }





  return (
    <View>
      <Text style={styles.graphTitle}>Daily steps</Text>
      <TouchableOpacity onPress={handleAddStep} style={styles.addStepBtn}>
        <AntDesign name="plus" size={24} color="#6c63ff" />
      </TouchableOpacity>
      <View
        style={{
          width: "100%",
          height: 50,
          justifyContent: "center",
          paddingVertical: 6,
        }}
      >
        <SegmentedControl
          values={["D", "w", "M", "6M", "Y"]}
          selectedIndex={selectedIndexStep}
          onChange={(event) => {
            setSelectedIndexStep(event.nativeEvent.selectedSegmentIndex);
          }}
          style={{ marginVertical: 10 }}
        />
      </View>
      {steps ? (
        <>
          <BarChartRNG
            key={selectedIndexStep}
            data={steps[selectedIndexStep]}
            backgroundColor="white"
            height={250}
            width={screenWidth - 50}
            barWidth={getWidthSpace(selectedIndexStep).barWidth}
            barBorderRadius={5}
            spacing={getWidthSpace(selectedIndexStep).spacing}
            noOfSections={4}
            xAxisThickness={0}
            yAxisThickness={0}
            xAxisLabelTextStyle={{ color: "gray", fontSize: 11 }}
            yAxisLabelTextStyle={{ color: "gray", fontSize: 10 }}
            chartConfig={{
              yAxisLabelInterval: 8, // This controls the interval between the y-axis labels
            }}
            isAnimated
            animationDuration={500}
            frontColor={"#00ec61"}
            renderTooltip={(item, index) => {
              return (
                <View
                  style={{
                    marginBottom: -10,
                    marginLeft: -6,
                    backgroundColor: "#ff911b",
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                    borderRadius: 4,
                    borderColor: "white",
                    borderWidth: 1,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Steps: {item.value}
                  </Text>
                </View>
              );
            }}
          />
        </>)
       : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available</Text>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  graphTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  addStepBtn: {
    alignItems: 'flex-end'
  }

});
