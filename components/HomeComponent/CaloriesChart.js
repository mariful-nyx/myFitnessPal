import { Dimensions, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { BarChart as BarChartRNG } from "react-native-gifted-charts";
import { caloriesSample } from "../../screens/sampleItems";
import { formatMonth, getWeekday, getWidthSpace } from "./StepsChart";
import moment from "moment";

const screenWidth = Dimensions.get("window").width;

export default function CaloriesChart({ data }) {


  const [selectedIndexCalories, setSelectedIndexCalories] = useState(0);


  const date = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(date);

  const [selectedIndexStep, setSelectedIndexStep] = useState(0);
  const [calories, setcalories] = useState();

  useEffect(() => {
    if (data) {
      const newcalories = data[selectedDate]?.map((item) => ({
        value: item.calories,
        label: moment(item.timestamp).format("ha"),
      }));

      setcalories({ 0: newcalories });
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      const caloriesPerDayAcc = [];
      const caloriesPerWeekDayAcc = [];
      const caloriesPerMonthAcc = {}; // To accumulate calories per month

      // Iterate through the data
      for (let date in data) {
        const records = data[date];
        let totalcalories = 0;
        let count = 0;

        records.forEach((record) => {
          if (record) {
            totalcalories += record.calories;
            count++;
          }
        });

        // Calculate the average calories per day
        const averagecalories = count > 0 ? totalcalories / count : 0;

        // Push the result as an object into the array
        caloriesPerDayAcc.push({
          value: Math.floor(averagecalories),
          label: date, // Use Math.round, Math.ceil, or Math.floor as needed
        });

        caloriesPerWeekDayAcc.push({
          value: Math.floor(averagecalories),
          label: getWeekday(date), // Use Math.round, Math.ceil, or Math.floor as needed
        });

        // Calculate total calories per month
        const month = date.substring(0, 7); // Extract the month in "YYYY-MM" format (adjust as needed)
        if (!caloriesPerMonthAcc[month]) {
          caloriesPerMonthAcc[month] = { totalcalories: 0, count: 0 };
        }
        caloriesPerMonthAcc[month].totalcalories += totalcalories;
        caloriesPerMonthAcc[month].count += count;
      }

      // Calculate the average calories per month
      const caloriesPerMonth = [];
      for (let month in caloriesPerMonthAcc) {
        const { totalcalories, count } = caloriesPerMonthAcc[month];
        const averagecalories = count > 0 ? totalcalories / count : 0;
        caloriesPerMonth.push({
          value: Math.floor(averagecalories),
          label: formatMonth(month), // Month in "YYYY-MM" format
        });
      }

      // Update the state with the calculated calories data
      setcalories((prev) => ({
        ...prev,
        1: caloriesPerWeekDayAcc,
        2: caloriesPerDayAcc,
        3: caloriesPerMonth.slice(0, 5),
        4: caloriesPerMonth,
      }));
    }
  }, [data]);

  return (
    <View>
      <Text style={styles.graphTitle}>Daily Calories Burned</Text>
      <>
        <SegmentedControl
          values={["D", "w", "M", "6M", "Y"]}
          selectedIndex={selectedIndexCalories}
          onChange={(event) => {
            setSelectedIndexCalories(event.nativeEvent.selectedSegmentIndex);
          }}
          style={{ marginVertical: 10 }}
        />
        <BarChartRNG
          key={selectedIndexCalories}
          data={calories && calories[selectedIndexCalories]}
          backgroundColor="white"
          height={250}
          width={screenWidth - 50}
          barWidth={getWidthSpace(selectedIndexCalories).barWidth}
          barBorderRadius={5}
          spacing={getWidthSpace(selectedIndexCalories).spacing}
          noOfSections={4}
          xAxisThickness={0}
          yAxisThickness={0}
          xAxisLabelTextStyle={{ color: "gray", fontSize: 11 }}
          yAxisLabelTextStyle={{ color: "gray" }}
          isAnimated
          animationDuration={500}
          frontColor={"#ff911b"}
          renderTooltip={(item, index) => {
            return (
              <View
                style={{
                  marginBottom: -10,
                  marginLeft: -6,
                  backgroundColor: "#00ec61",
                  paddingHorizontal: 6,
                  paddingVertical: 4,
                  borderRadius: 4,
                  borderColor: "white",
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
                >
                  Calories: {item.value}
                </Text>
              </View>
            );
          }}
        />
      </>
      {/* ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      )} */}
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
});
