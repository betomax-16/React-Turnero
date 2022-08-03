import { useState, useEffect, useContext } from "react";
import { useForm, Controller  } from "react-hook-form";
import AppContext from "../../../context/app/app-context";
import axios from "axios";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import { DataGrid, esES } from '@mui/x-data-grid';
import { ChromePicker  } from 'react-color';
import './styles.css';

// const protocol = window.location.protocol;
// const host = window.location.host;

function Brands(props) {
    const columns = [
        { field: 'name', headerName: 'Marca', flex: 1 },
        { field: 'logo', headerName: 'Logo', flex: 1 }
    ];

    const { showAlert } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [brands, setBrands] = useState([]);
    const [brandSelected, setBrandSelected] = useState(null);
    const [color, setColor] = useState({hex: "#782929"});

    const { control, handleSubmit, setValue, formState: { errors } } = useForm({defaultValues: {
        color: '',
        name: '',
        logo: ''
    }});
    const onSubmit = data => handleSave(data);

    useEffect(() => {
        getBrands();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    const getBrands = async() => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/v1/brands`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            const auxData = [];
            
            res.data.body.forEach(element => {
                auxData.push({ 
                    id: element._id,
                    name: element.name, 
                    color: element.color,
                    logo: element.logo,
                });                
            });

            const auxSucursals = auxData.sort(( a, b ) => {
                if ( a.name < b.name ){
                  return -1;
                }
                if ( a.name > b.name ){
                  return 1;
                }
                return 0;
            });

            setBrands(auxSucursals);
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
            }
            else {
                showAlert("red", 'Ocurrió algún error interno.');
            }
        }
    }

    const handleClose = () => {
        setBrandSelected(null);
        setOpen(false);
    };

    const handleChangeColor = (color) => {
        setValue("color", color.hex);
        setColor(color);
    };

    const handleSave = async (data) => {
        console.log(data);
        // let url = `http://${window.location.hostname}:4000/api/sucursal/${data.name}`;
        // let bodyRequest = {};
        // const user = getDataUser();
        // try {
        //     const req = {
        //         color: data.color,
        //         timeLimit: data.timeLimit,
        //         print: data.print,
        //         messageTicket: data.messageTicket
        //     };
        //     bodyRequest = req;
        //     const res = await axios.put(url, req, { 
        //         headers: {
        //             'auth': localStorage.getItem('token')
        //         }
        //     }); 

        //     const dataSave = {
        //         username: user ? user.username : null,
        //         source: 'admin',
        //         action: 'sucursales.js (handleSaveConfig [Configuracion de sucursal])',
        //         apiUrl: url,
        //         bodyBeforeRequest: preSaveData,
        //         bodyRequest: bodyRequest,
        //         bodyResponse: res.data
        //     };
        //     Log.SendLogAction(dataSave);

        //     setOpenConfig(false);
        //     setPreSaveData({});
        //     showAlert("green", "Cambios exitosos.");
        // } catch (error) {
        //     console.log(error);
        //     if (error.response && error.response.data) {
        //         showAlert("red", error.response.data.body.message);
        //         const dataSave = {
        //             username: user ? user.username : null,
        //             source: 'admin',
        //             action: 'sucursales.js (handleSaveConfig [Configuracion de sucursal])',
        //             apiUrl: url,
        //             bodyRequest: bodyRequest,
        //             bodyResponse: error.response.data
        //         };
        //         Log.SendLogError(dataSave);
        //     }
        //     else {
        //         showAlert("red", 'Ocurrió algún error interno.');
        //     }
        // }
    }

    return (<>
        <div className="sucursal-container">
            <h1>Marcas</h1>
            <div className="table">
                <DataGrid
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    rows={brands}
                    columns={columns}
                    pageSize={14}
                    rowsPerPageOptions={[14]}
                    disableSelectionOnClick
                />
            </div>
        </div>

        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
                Nueva marca
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
                <div className="content-modal-sucursal">
                    <ChromePicker color={color} onChange={handleChangeColor}/>
                    <FormGroup>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <TextField
                                    margin="dense"
                                    id="name"
                                    label="Marca"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    {...field}
                            />}
                        />
                        <Controller
                                    name="color"
                                    control={control}
                                    render={({ field }) => <TextField
                                            disabled
                                            error={errors.color?.type === 'required'}
                                            helperText={errors.color ? 'Campo obligatorio.' : ''}
                                            autoFocus
                                            margin="dense"
                                            id="color"
                                            label="Color"
                                            type="text"
                                            fullWidth
                                            variant="standard"
                                            {...field}
                                    />}
                                    rules={{ required: true }}
                                />
                    </FormGroup>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
            </DialogActions>
            </form>
        </Dialog>
    </>);
}

export default Brands;