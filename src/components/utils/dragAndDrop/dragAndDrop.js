import { useRef, useEffect, useContext } from "react";
import AppContext from "../../../context/app/app-context";
import PropTypes from 'prop-types';
import CardAd from "./cardAd/cardAd";
import './styles.css';

export default function FilesDragAndDrop({onUpdateAd, onDeleteAd, onUpload, children, count, formats, ads}) {
    const { showAlert } = useContext(AppContext);
    const drop = useRef(null);

    useEffect(() => {
        drop.current.addEventListener('dragover', handleDragOver);
        drop.current.addEventListener('drop', handleDrop);
      
        return () => {
            if (drop && drop.current) {
                drop.current.removeEventListener('dragover', handleDragOver);
                drop.current.removeEventListener('drop', handleDrop);
            }
        };
    }, []);
      
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // this is required to convert FileList object to array
        const files = [...e.dataTransfer.files];

        // check if the provided count prop is less than uploaded count of files
        if (count && count < files.length) {
            showAlert("yellow", `Solo se pueden subir ${count} archivo${count !== 1 ? 's' : ''} a la vez`);
            return;
        }

        // check if some uploaded file is not in one of the allowed formats
        if (formats && files.some((file) => !formats.some((format) => file.name.toLowerCase().endsWith(format.toLowerCase())))) {
            showAlert("yellow", `Solo se aceptan los siguientes formatos de archivo: ${formats.join(', ')}`);
            return;
        }

        if (files && files.length) {
            onUpload(files);
        }
    };

    return (
        <div className="form-box" ref={drop}>
            <div className="grid-image">
                {ads && ads.map((item, index) => <CardAd key={index} data={item} onDeleteAd={onDeleteAd} onUpdateAd={onUpdateAd}/>)}
            </div>
            {children && (!ads || !ads.length) ? children : <></>}
        </div>
    );
}
  
FilesDragAndDrop.propTypes = {
    onUpload: PropTypes.func.isRequired,
};