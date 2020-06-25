import firestore from '@react-native-firebase/firestore';

//Add image, prediction and correected label to firebase database
export async function addImageWithCorrectedLabel(image_URL, prediction, top_prediction_confidence, correct_label) {
    firestore()
     .collection('imageLabelCollection')
     .add({
       image_URL: image_URL,
       prediction: prediction,
       confidence: top_prediction_confidence,
       correct_label: correct_label
     })
     .then(() => {
       console.log('Image and label added!');
     })
     .catch(error => {
       const { code, message } = error;
       console.log(message)
     });

}
