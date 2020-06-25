import React, { PureComponent } from 'react';
import {TextInput, Button, ActivityIndicator, AppRegistry, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';

import { RNCamera } from 'react-native-camera'; //Camera component
import Dialog, { DialogTitle, DialogFooter, DialogButton, DialogContent } from 'react-native-popup-dialog'; //Used to create popup correction form
import SelectMultiple from 'react-native-select-multiple' //Used for popup multichoice selection
import {addImageWithCorrectedLabel} from './firebase'; //Custom function to send image, prediction, and correct label to firestor

console.disableYellowBox = true;

const waste_labels = ['Trash', 'Paper', 'Cardboard','Plastic','Metal']


export default class FetchExample extends React.Component {

  constructor(props){
    super(props);
    this.state ={
      image_URL : '',
      is_loading: false, //boolean to display loading spinner
      picture_taken: false,
      data_source: '', //string to store all predictions JSON responses
      top_prediction: '',
      top_prediction_confidence: null,
      correct_label: [],
      toggleModal: false,
      corrected: false,
    }
  }

  //Send POST request to Y Lambda Server with photo
  //Wait for response and set responses to state variables
  doPostCallback(image_URL){
    console.log("\nPost Callback");

    //Create body request
    let body = new FormData();
    body.append('image', {uri: image_URL, name: 'photo.jpg', type: 'image/jpg'});
    body.append('name', 'image_taken');
    //Send request
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
        //grab all and top predictions
        var all_predictions = (response.predictions);
        var top_prediction = response.predictions[0];
        //set predictions with confidence level to state
        this.setState({
          is_loading: false,
          data_source: all_predictions,
          top_prediction: response.predictions[0][0],
          top_prediction_confidence: Math.round(100 * response.predictions[0][1]),
        })
      })
      .catch(error => {
        console.log("upload error", error);
      });
	}

  //Take pricture and send image to Y Lambda Server for classification
  takePicture = async() => {
     if (this.camera) {
       const options = { quality: 0.5, base64: true };
       const data = await this.camera.takePictureAsync(options);
       console.log(data.uri);
       this.setState({
         is_loading: true,
         picture_taken: true,
         image_URL: data.uri,
         corrected:false
       })
       this.doPostCallback(data.uri);
     }
  };


  selectCorrectLabel = async(correct_label) => {
    this.setState({ correct_label })
  }

  //Add image, prediction and correected label to firebase database
  sendCorrectLabel = async() => {
    this.setState({ toggleModal: false, corrected:true })
    let correct_label = this.state.correct_label[0].value
    addImageWithCorrectedLabel(this.state.image_URL,this.state.top_prediction,this.state.top_prediction_confidence,correct_label)
  }

  showCorrectLabelButton = ()=> {
    if(this.state.corrected){
      return(
        <View style={{ paddingTop: 60,marginBottom: 20, flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => { this.setState({ toggleModal: true }); }} style={styles.correctLabel}>
            <Text style={{ fontSize: 12, color:  '#37ad37', fontWeight: 'bold' }}> Corrected</Text>
          </TouchableOpacity>
        </View>

      );
    }
    else{
      return(
        <View style={{ paddingTop: 60,marginBottom: 20, flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => { this.setState({ toggleModal: true }); }} style={styles.correctLabel}>
            <Text style={{ fontSize: 12, color: 'black', fontWeight: 'bold' }}> Correct Label </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  //If Prediction is received from server show prediction, else display loading spinner
  showPrediction = () =>{
      if(this.state.is_loading){
        return(
          <View style={{flex: 1, padding: 50}}>
            <ActivityIndicator/>
          </View>
        )
      }
      else if(this.state.picture_taken){
        return(
          <View style={{flex: 0, paddingTop:20, alignItems: 'center'}}>
            <Text style={{ alignText: 'center', fontWeight: 'bold', fontSize: 30, color: '#37ad37'}}>{this.state.top_prediction.toUpperCase()}</Text>
            <Text style={{ alignText: 'center', fontWeight: 'bold', fontSize: 20, color: 'black'}}>{this.state.top_prediction_confidence}%</Text>

            {this.showCorrectLabelButton()}

            <Dialog
                visible={this.state.toggleModal}
                dialogTitle={<DialogTitle title="Correct Label" />}
                footer={
                  <DialogFooter>
                    <DialogButton
                      text="CANCEL"
                      onPress={() => {this.setState({ toggleModal: false });}}
                    />
                    <DialogButton
                      text="OK"
                      onPress={() => {this.sendCorrectLabel()}}
                    />
                  </DialogFooter>
                }
              >
              <DialogContent>
                <View style={{ flex: 0,width: 150, height: 250, justifyContent: 'center' }}>
                  <SelectMultiple
                      style={{ width: 150, height: 250 }}
                      items={waste_labels}
                      selectedItems={this.state.correct_label}
                      onSelectionsChange={this.selectCorrectLabel}
                      maxSelect={1}
                  />
                </View>
              </DialogContent>
            </Dialog>

          </View>
        );
      }
  }


  //Render frontend
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
  correctLabel: {
    position: 'absolute',
    bottom: 0,
    flex: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    alignSelf: 'center',
    margin: 20,
    borderWidth: 1,
    borderColor: '#37ad37',
  },
  PredictionContainer: {
    flex: 0.3,
    backgroundColor: 'white',
  },
});
