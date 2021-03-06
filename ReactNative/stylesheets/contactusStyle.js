import {StyleSheet} from 'react-native';

module.exports =  StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scrollView: {
    paddingBottom: 25,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    fontFamily: 'Avenir',
    textAlign: 'center',
    alignSelf: 'center',
    color: '#34495e',
  },
  pageText: {
    fontFamily: 'Avenir',
    color: '#34495e',
    fontWeight: 'normal',
  },
  boldText: {
    fontFamily: 'Avenir',
    color: '#34495e',
    fontWeight: 'bold',
    margin: 0,
  }
});
