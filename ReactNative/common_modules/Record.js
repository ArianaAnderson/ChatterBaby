import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';
// import library for navigation objects and routing
import { StackNavigator, TabNavigator } from 'react-navigation';
// import to record audio
import { AudioRecorder, AudioUtils } from 'react-native-audio';
// import for progress bar
import * as Progress from 'react-native-progress';
// import form histogram/barchart
import { Bar } from 'react-native-pathjs-charts';
// import FontAwesome icons
import Icon from 'react-native-vector-icons/FontAwesome';
// import for web api call and process audio file from local storage
import axios from 'axios';
import RNFetchBlob from 'react-native-fetch-blob';

export default class Record extends Component<{}> {
  constructor(props) {
    super(props);
    //algorithm requires .ACC extension but this a mistake should be .AAC
    let path = AudioUtils.DocumentDirectoryPath + '/audioTest.AAC'; 
    this.state = {
      showChart: false,
      progress: 0,
      currentTime: 0.0,
      stoppedRecording: false,
      finished: false,
      audioPath: path,
      hasPermission: undefined,
      painResponse: .22,
      hungryResponse: .50,
      fussyResponse: .28,
    }
  }

  // check permission, if okay then configure AudioRecorder
  componentDidMount() {
    this.checkPermission().then((hasPermission) => {
      this.setState({ hasPermission });
      if (!hasPermission) return;
      this.prepareRecordingAtPath(this.state.audioPath);
      AudioRecorder.onProgress = (data) => {
        var floorTime = Math.floor(data.currentTime);
        if (floorTime == 5) {
          this.stop();
        } else {
          this.setState({progress: data.currentTime, currentTime: floorTime});
          console.log("onProgress data", data); // return {currentTime: 2} on android
        }
      };
      AudioRecorder.onFinished = (data) => {
        console.log("onFinished data", data); // returning null on android
        if (Platform.OS === 'ios') {
          this.finishRecording(data.status === 'OK', data.audioFileURL);
        }
      };
    });
  }

  // wrapper for the AudioRecorder prepareRecordingAtPath method
  prepareRecordingAtPath(path) {
    console.log('file path', path);

    AudioRecorder.prepareRecordingAtPath(path, {
      SampleRate: 32000,
      Channels: 1,
      AudioQuality: 'High',
      AudioEncoding: 'aac'
      /*
        if (Platform.OS === 'android') {
          AudioEncodingBitRate: 16000,
          OutputFormat: 'aac_adts',
          SampleRate: 32000,
          Channels: 1,
          AudioQuality: 'High',
          AudioEncoding: 'aac'
        }
      */
    });
  }

  // ensure permission asked on Android during run-time per the platform standards
  checkPermission() {
    if (Platform.OS !== 'android') {
      return Promise.resolve(true);
    }
    const rationale = {
      'title': 'Microphone Permission',
      'message': 'ChatterBaby needs to access your microphone to create the audio sample.'
    }
    return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale)
      .then((result) => {
        console.log('Permission result: ', result);
        return (result === true || result === PermissionsAndroid.RESULTS.GRANTED);
      });
  }

  // update state when recording is finished
  // send file to api for processing
  finishRecording(didSucceed, filePath) {
    this.setState({ finished: didSucceed });
    console.log('Finished recording of duration ${this.state.currentTime} seconds at path: ${filePath}');
/*
    console.warn("file audio path", this.state.audioPath);
    // use wrapper to parse saved audio file
    // send audio to api
    RNFetchBlob.fetch('POST',
      'https://chatterbaby.org/app-ws/app/process-data-v2', {
      //Authorization : "Bearer access-token",
      'Content-Type' : 'multipart/form-data',
    },[
      { name: 'mode', data: 'whyCry' },
      { name: 'token', data: 'test' },
      { name: 'test', filename: 'test.ACC', data : RNFetchBlob.wrap(this.state.audioPath)},
    ])
    .then((response) => {
      console.warn('rnfetch audio response', response);
      console.warn('rnfetch audio result', response.data.result);
      // parse response to update state barchart values
      // {"result":{"Fussy":0.398,"Hungry":0.316,"Pain":0.286},"record_id":"941","errmsg":""}
      this.setState({
        painResponse: response.data.result.Pain,
        hungryResponse: response.data.result.Hungry,
        fussyResponse: response.data.result.Fussy,
      });
    })
    .catch((error) => {
      console.warn('rnfetch audio error', error);
    })
  }
*/
  RNFetchBlob.fs.readFile(this.state.audioPath, 'base64')
  .then((audioData) => {
    console.warn(audioData);
    // handle the data ..
    var data_values = {
      mode: 'whyCry',
      token: '',
      data: audioData
    };
    // call API w axios
    axios({
      url: 'https://chatterbaby.org/app-ws/app/process-data-v2',
      method: 'post',
      data: { mode: 'whyCry', token: '', data: audioData }
    })
    .then((response) => {
        console.warn('rnfetch audio response', response);
        console.warn('rnfetch audio result', response.data.result);
        // parse response to update state barchart values
        // {"result":{"Fussy":0.398,"Hungry":0.316,"Pain":0.286},"record_id":"941","errmsg":""}
        this.setState({
          painResponse: response.data.result.Pain,
          hungryResponse: response.data.result.Hungry,
          fussyResponse: response.data.result.Fussy,
        });
    })
    .catch((error) => {
      console.warn('error sending recording to api', error);
      console.warn(error);
    });
    //.done(() => {});
  })
  .catch((err) => { console.warn('readFile error' + err ) })
}

  // button style factory: toggle record button style btw active and inactive mode
  renderButton(title, onPress, active) {
    var style = (active) ? styles.activeButtonText : styles.inactiveButtonText;

    return (
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={style}>
          {title}
          </Text>
        </TouchableOpacity>
    );
  }

  // update state and AudioRecorder object when recording stops
  async stop() {
      if ( !this.state.recording ) {
        console.warn('Can\'t stop, not recording');
        return
      }
      this.setState({ showChart: true, stoppedRecording: true, recording: false, progress: 0, currentTime: 0.0 });
      try {
        const filePath = await AudioRecorder.stopRecording();
        if (Platform.OS === 'android') {
          this.finishRecording(true, filePath);
        }
        return filePath;
      } catch (error) {
        console.error(error);
      }
  }

  // update state and call AudioRecorder startRecording method when recording begins
  async record() {
    if (this.state.recording) {
      console.warn('Already recording!');
      return;
    }

    if ( !this.state.hasPermission ) {
      console.warn('Can\'t record, no permission granted!');
      return;
    }

    if (this.state.stoppedRecording) {
      this.prepareRecordingAtPath(this.state.audioPath);
    }
    this.setState({ recording: true });
    try {
      const filePath = await AudioRecorder.startRecording();
      console.log('startRecording');
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    var data = [
      [{"v": this.state.painResponse, "name": "Pain"}],
      [{"v": this.state.hungryResponse, "name": "Hungry"}],
      [{"v": this.state.fussyResponse, "name": "Fussy"}]
    ]
    var chartOptions = {
      width: 300,
      height: 300,
      margin: {
        top: 20,
        left: 25,
        bottom: 50,
        right: 20
      },
      color: '#2980B9',
      gutter: 20,
      animate: {
        type: 'oneByOne',
        duration: 200,
        fillTransition: 3
      },
      axisX: {
        showAxis: true,
        showLines: false,
        showLabels: true,
        zeroAxis: false,
        orient: 'bottom',
        label: {
          fontFamily: 'Arial',
          color: '#f58357',
          fontSize: 18,
          fontWeight: true,
          fill: '#34495E'
        }
      },
      axisY: {
        showAxis: true,
        showLines: false,
        showLabels: true,
        showTicks: true,
        zeoAxis: false,
        orient: 'left',
        label: {
          fontFamily: 'Arial',
          color: '#f58357',
          fontSize: 12,
          fontWeight: true,
          fill: '#34495E'
        }
      }
    }

    var renderContent = (<View style={{flex: 1, justifyContent:'center', alignItems: 'center'}}>
                            <Bar data={data} options={chartOptions} accessorKey='v'
                                 pallete={[ { 'r': 245, 'g': 131, 'b': 87 },
                                            { 'r': 253, 'g': 186, 'b': 49 },
                                            { 'r': 95, 'g': 151, 'b': 203} ]}/>
                            <View style={{margin: 20, justifyContent:'center', alignItems: 'center'}}>
                              <Icon.Button name="times" size={25} backgroundColor='#f92222'
                                          onPress={ () => this.setState({showChart: false}) }></Icon.Button>
                              </View>
                        </View>);
/*
<TouchableOpacity style={styles.cancelButton}
                  onPress={ () => this.setState({showChart: false}) }>
    <Text style={styles.cancelText}> X </Text>
</TouchableOpacity>

*/


    if ( !this.state.showChart ) {
      renderContent = <View>
        <Progress.Circle style={{ justifyContent: 'center', alignItems: 'center' }}
                        progress={ this.state.progress/5 }
                        size={300}
                        thickness={5}
                        color={'#5f97cb'}
                        borderWidth={0} />
        <View style={styles.controls}>
          {this.renderButton('Record', () => { this.record() }, this.state.recording ) }
        </View>
      </View>
    };
    return (
      <View style={styles.container}>
        { renderContent }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressText: {
    paddingTop: 50,
    fontSize: 50,
    color: '#fff'
  },
  button: {
    padding: 20
  },
  cancelButton: {
    padding: 20,
    backgroundColor: '#f92222'
  },
  cancelText: {
    fontSize: 14,
    color: '#fff'
  },
  disabledButtonText: {
    padding: 20,
    color: '#eee'
  },
  inactiveButtonText: {
    fontSize: 25,
    color: '#2b608a'
  },
  activeButtonText: {
    fontSize: 25,
    color: '#fdba31'
  },
});
