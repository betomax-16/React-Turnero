import moment from "moment";
import Tooltip from '@mui/material/Tooltip';
import './styles.css';

function TurnCard(props) {

    const getStatusColor = () => {
        let color = 'free';
        switch (props.data.status) {
            case 'Libre':
                color = 'free';
            break;
            case 'Activo':
                color = 'active';
            break;
            case 'Tarde':
                color = 'late';
            break;
            default:
            break;
        }
    
        return color;
    }

    const getMessageToolTip = () => {
        return props.data.username ? `En atención con: ${props.data.username}` : 'Libre';
    }
  
    return (<>
        <Tooltip title={getMessageToolTip()} followCursor>
            <div className="turnCard" onClick={props.click}>
                <div className={'container-box ' + getStatusColor()}>
                    <div className="turnCard-body">
                        <span>{props.data.turn}</span>          
                    </div>
                    <div className="turnCard-footer">
                        <span className="hour">{moment(props.data.startDate).format('HH:mm')}</span>
                    </div>
                </div>
            </div>
        </Tooltip>
    </>);
  }
  
  export default TurnCard;