import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import AppContext from "../../../context/app/app-context";
import axios from "axios";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { DataGrid, esES } from '@mui/x-data-grid';
import './styles.css';

// const protocol = window.location.protocol;
// const host = window.location.host;

function Sucursales(props) {
    const columns = [
        { field: 'sucursal', headerName: 'Sucursal', flex: 1 },
        { field: 'url', headerName: 'Toma turno', flex: 1,
            renderCell: (params) => (
               <Link className="button-link" to={`/toma-turno/${params.value}`} target={'_blank'}>
                   Abrir Toma Turno
               </Link> 
        ),},
        { field: 'urlScreen', headerName: 'Pantalla', flex: 1,
            renderCell: (params) => (
               <Link className="button-link" to={`/pantalla/${params.value}`} target={'_blank'}>
                   Abrir Pantalla
               </Link> 
        ),},
        { field: 'associate', headerName: 'Asociar', flex: 1,
            renderCell: (params) => (
               <div className="button-associate" onClick={async () => {
                    const sucursal = params.value;
                    setSucursalSelected(sucursal);
                    await getAreasBySucursal(sucursal);
                    setOpen(true);
               }}>
                   Asociar Areas
               </div> 
        ),},
    ];

    const [sucursalSelected, setSucursalSelected] = useState(null);
    const { showAlert } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [sucursals, setSucursals] = useState([]);
    const [areas, setAreas] = useState([]);

    const [copyAreasSucursal, setCopyAreasSucursal] = useState({});
    const [areasSucursal, setAreasSucursal] = useState({});

    useEffect(() => {
        getSucursals();
        getAreas();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    const getSucursals = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/sucursal`);
            const auxData = [];
            
            res.data.body.forEach(element => {
                auxData.push({ 
                    id: element._id,
                    sucursal: element.name, 
                    url: btoa(element.name),
                    urlScreen: btoa(element.name),
                    associate: element.name
                });                
            });

            setSucursals(auxData);
        } catch (error) {
            if (error.response.data) {
                console.log(error.response.data);
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", 'Ocurrio algun error interno.');
            }
        }
    }

    const getAreas = async () => {
        try {
            const res = await axios.get(`http://localhost:4000/api/areas`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            const auxData = [];
            const auxSelectAreas = {};
            
            res.data.body.forEach(element => {
                auxData.push({ 
                    name: element.name
                });

                auxSelectAreas[element.name] = false;
            });

            setAreas(auxData);
            setAreasSucursal(auxSelectAreas);
        } catch (error) {
            if (error.response.data) {
                console.log(error.response.data);
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", 'Ocurrio algun error interno.');
            }
        }
    }

    const getAreasBySucursal = async (sucursal) => {
        try {
            const res = await axios.get(`http://localhost:4000/api/area-sucursal/${sucursal}`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const areasReturn = { ...areasSucursal };
            const auxData = [];
            res.data.body.forEach(element => {
                auxData[element.area] = 
                auxData.push({ 
                    area: element.area
                });
            });

            areas.forEach(area => {
                const found = auxData.find(element => element.area === area.name);  
                areasReturn[area.name] = found !== undefined;
            });

            setAreasSucursal(areasReturn);
            setCopyAreasSucursal(areasReturn);
        } catch (error) {
            if (error.response && error.response.data) {
                console.log(error.response.data);
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", 'Ocurrio algun error interno.');
            }
        }
    }

    const handleCheckAll = (event) => {
        const dataAux = { ...areasSucursal };
        for (const property in dataAux) {
            dataAux[property] = event.target.checked;
        }

        setAreasSucursal(dataAux);
    }

    const handleCheckArea = (area, value) => {
        const auxData = { ...areasSucursal };
        auxData[area] = value;

        setAreasSucursal(auxData);
    }

    const handleClose = () => {
        setSucursalSelected(null);
        setOpen(false);
    };

    const handleSave = () => {
        const deleteRow = [];
        const insertRow = [];
        for (const property in copyAreasSucursal) {
            if (copyAreasSucursal[property] !== areasSucursal[property]) {
                if (areasSucursal[property]) {
                    insertRow.push({area: property, sucursal: sucursalSelected});
                }
                else {
                    deleteRow.push({area: property, sucursal: sucursalSelected});
                }
            }
        }


        try {
            if (deleteRow.length > 0) {
                deleteRow.forEach(async element => {
                    await axios.delete(`http://localhost:4000/api/area-sucursal/${element.sucursal}/${element.area}`, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    }); 
                });
            }
    
            if (insertRow.length > 0) {
                insertRow.forEach(async element => {
                    await axios.post(`http://localhost:4000/api/area-sucursal`, element, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    }); 
                });  
            }

            setOpen(false);
            showAlert("green", "Cambios exitosos.");
        } catch (error) {
            if (error.response && error.response.data) {
                console.log(error.response.data);
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", 'Ocurrio algun error interno.');
            }
        }
    }

    const printCheckBox = () =>  {
        const result = [];
        let index = 0;
        for (const property in areasSucursal) {
            result.push(<FormControlLabel key={index} control={<Checkbox onChange={(e) => handleCheckArea(property, e.target.checked)} checked={areasSucursal[property]} />} label={property} />);
            index++;
        }

        return result;
    }

    return (<>
        <div className="sucursal-container">
            <h1>Sucursales</h1>
            <div className="table">
                <DataGrid
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    rows={sucursals}
                    columns={columns}
                    pageSize={14}
                    rowsPerPageOptions={[14]}
                    disableSelectionOnClick
                />
            </div>
        </div>
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
                <Checkbox onChange={handleCheckAll}/>
                Areas en: {sucursalSelected}
            </DialogTitle>
            <DialogContent>
                <FormGroup>
                    {printCheckBox()}
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>
    </>);
}

export default Sucursales;