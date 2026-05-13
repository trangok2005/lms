import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';


export default function App() {
  return (
    <View style={styles.container}>
      <Text>trang dep tai ok heeeee</Text>
      <TextInput style={styles.input}>nhap gi di</TextInput>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'WHILE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: 'red100',
  }
});
