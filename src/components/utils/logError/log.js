import axios from "axios";

class Log {
  static SendLogError = async (data) => {
    try {
        await axios.post(`http://${window.location.hostname}:4000/api/log/error`, data, { 
          headers: {
              'me': ''
          }
        });
      } catch (error) {
        console.log(error);
      }
  }

  static SendLogAction = async (data) => {
    try {
        await axios.post(`http://${window.location.hostname}:4000/api/log/action`, data, { 
          headers: {
              'me': ''
          }
        });
      } catch (error) {
        console.log(error);
      }
  }
}
export default Log;

