import React, { PureComponent } from 'react';
import {Button, ActivityIndicator, AppRegistry, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { RNCamera } from 'react-native-camera';
import firestore from '@react-native-firebase/firestore';
import Modal from 'react-native-modal';

const imageLabelCollection = firestore().collection('imageLabel');

console.disableYellowBox = true;

export default class FetchExample extends React.Component {

  constructor(props){
    super(props);
    this.state ={
      isLoading: false,
      pictureTaken: false,
      dataSource: '',
      top_prediction: '',
      top_prediction_confidence: null,
      backendURL: '',
    }
  }


 doPostCallback(imageURL){
    console.log("\nPost Callback");
    console.log(imageURL);

    let body = new FormData();
    body.append('image', {uri: imageURL, name: 'photo.jpg', type: 'image/jpg'});
    body.append('name', 'hey');

		fetch("https://ylambda.io/recycleai/upload",
      { method: 'POST',
        headers:
          {
            'Accept': 'application/json',
            "Content-Type": "multipart/form-data",
          },
        body : body
      })
      .then(response => response.json())
      .then(response => {

        var all_predictions = (response.predictions);
        var top_prediction = response.predictions[0];

        this.setState({
          isLoading: false,
          dataSource: all_predictions,
          top_prediction: response.predictions[0][0],
          top_prediction_confidence: Math.round(100 * response.predictions[0][1]),
        })
        //Add image and prediction to firebase database
        firestore()
         .collection('imageLabelCollection')
         .add({
           imageURL: imageURL,
           top_prediction: response.predictions[0][0],
         })
         .then(() => {
           console.log('image and label added!');
         });

      })
      .catch(error => {
        console.log("upload error", error);

      });

	}

  takePicture = async() => {
   if (this.camera) {
     this.setState({
       isLoading: true,
       pictureTaken: true
     })
     const options = { quality: 0.5, base64: true };
     const data = await this.camera.takePictureAsync(options);
     console.log(data.uri);

     this.doPostCallback(data.uri);

   }
 };

  render() {
    return (

      <View style={styles.container}>
      <StatusBar hidden />
      <View style={{flexDirection:"row",alignSelf:'center'}}>
          <View style={{paddingTop: 6}}>
              <Text style={{color: 'black', fontSize: 21, fontWeight:'bold'}}>Recycle</Text>
          </View>
          <View style={{paddingTop: 6}}>
              <Text  style={{color: '#37ad37',fontSize: 21}} >_ai</Text>
          </View>
      </View>

        <View style={styles.ImageContainer}>
          <RNCamera
            ref={ref => {
              this.camera = ref;
            }}
            style={styles.preview}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}

          />
          <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
            <TouchableOpacity onPress={this.takePicture.bind(this)} style={styles.capture}>
              <Text style={{ fontSize: 14, color: '#37ad37' }}> SNAP </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.PredictionContainer}>
            {this.showPrediction()}
        </View>

      </View>
    );
  }

  showPrediction = () =>{

    if(this.state.isLoading){
      return(
        <View style={{flex: 1, padding: 50}}>
          <ActivityIndicator/>
        </View>
      )
    }
    else if(this.state.pictureTaken){
      return(
        <View style={{flex: 1, paddingTop:20, alignItems: 'center'}}>
          <Text style={{ alignText: 'center', fontWeight: 'bold', fontSize: 30, color: '#37ad37'}}>{this.state.top_prediction.toUpperCase()}</Text>
          <Text style={{ alignText: 'center', fontWeight: 'bold', fontSize: 20, color: 'black'}}>{this.state.top_prediction_confidence}%</Text>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1.0,
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  ImageContainer: {
    flex: 0.8,
    position: 'relative',
    opacity: 1.0,
    padding: 10,
  },
  preview: {
    flex: 1.0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    opacity: 1.0,
  },
  capture: {
    position: 'absolute',
    bottom: 0,
    flex: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#37ad37',
  },
  PredictionContainer: {
    flex: 0.3,
    backgroundColor: 'white',
  },
});
