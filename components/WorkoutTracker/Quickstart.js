import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { AntDesign, Feather } from "@expo/vector-icons";
import { exerciseItems } from "../../screens/sampleItems";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";

const Quickstart = ({navigation}) => {
  const templates = [
    "dfvcdsvds",
    "sdcds",
    "fdvdfvdf",
    "dfvdfcvds",
    "dfvdvds",
    "dfvdfvdf",
    "dfvdfvdvdf",
  ];

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <Text>Quickstart</Text>
      <View style={styles.templateSection}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.heading}>Workout</Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('AddTemplate')}>
              <AntDesign name="plus" size={24} color="gray" />
            </TouchableOpacity>

            <Menu>
              <MenuTrigger>
                <Feather name="more-horizontal" size={24} color="gray" />
              </MenuTrigger>
              <MenuOptions>
                {exerciseItems &&
                  Object?.keys(exerciseItems)?.map((item, index) => (
                    <MenuOption
                      key={index}
                      style={styles.menuOption}
                      onSelect={() => toggleCategory(item)}
                    >
                      <Text style={styles.menuOptionText}>{item}</Text>
                    </MenuOption>
                  ))}
              </MenuOptions>
            </Menu>
          </View>
        </View>


        <View style={{ marginTop: 20 }}>
          <Text style={{ color: "gray", fontSize: 20, fontWeight: "bold" }}>
            Saved workout{" "}
          </Text>
          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {templates?.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#e6e6e6",
                  padding: 12,
                  width: screenWidth / 2 - 27,
                }}
                onPress={()=>navigation.navigate('StartWorkout', { name: 'Leg' })}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Quickstart;

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  templateSection: {
    marginTop: 20,
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "gray",
  },
});
