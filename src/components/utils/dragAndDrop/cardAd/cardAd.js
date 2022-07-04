import { useState } from "react";
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Confirm from "../../../utils/confirm/confirm";
import { MdOutlineClose } from "react-icons/md";
import { alpha, styled } from '@mui/material/styles';
import { green } from '@mui/material/colors';
import './styles.css';

const GreenSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: green[600],
      '&:hover': {
        backgroundColor: alpha(green[600], theme.palette.action.hoverOpacity),
      },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: green[600],
    },
}));

export default function CardAd(props) {
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleChange = (event, id) => {
        props.onUpdateAd(id, event.target.checked);
    };

    const handleDelete = () => {
        setOpenConfirm(true);
    }

    const handleAcceptConfirm = async () => {
        props.onDeleteAd(props.data._id);
        setOpenConfirm(false);
    };

    const handleCloseConfirm = () => {
        setOpenConfirm(false);
    };

    return (<>
        <div className="container-card">
            <Tooltip title="Eliminar">
                <span className='icon-close' onClick={handleDelete}><MdOutlineClose/></span>
            </Tooltip>
            <div className="card-image">
                <img className="img" src={props.data.url}></img>
            </div>
            <div className='card-switch'>
                <GreenSwitch
                    checked={props.data.isActive}
                    onChange={(e) => handleChange(e, props.data._id)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
            </div>
        </div>
        <Confirm 
                open={openConfirm}
                title={'Eliminar anuncio'} 
                message={'¿Desea realmente realizar la eliminación?'} 
                handleClose={handleCloseConfirm}
                handleAccept={handleAcceptConfirm}
                 />
    </>);
}