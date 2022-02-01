import { useState, useEffect } from "react";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import DateAdapter from '@mui/lab/AdapterMoment'
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import { MdOutlineRemoveCircleOutline } from "react-icons/md";
import './styles.css';

function ItemFilter(props) {
    const [operators] = useState([
        { value: "and", text: "Y" },
        { value: "or", text: "O" }
    ]);

    const [options, setOptions] = useState([
        { value: "=", text: "=" },
        { value: "!=", text: "!=" },
        { value: ">", text: ">" },
        { value: ">=", text: ">=" },
        { value: "<", text: "<" },
        { value: "<=", text: "<=" },
        { value: "%", text: "Contiene" }
    ]);

    const printOptions = (type) => {
        const auxOptions = [];

        switch (type) {
            case "string":
                auxOptions.push({ value: "=", text: "Es igual" });
                auxOptions.push({ value: "%", text: "Contiene" });
                break;
            case "number":
                auxOptions.push({ value: "=", text: "=" });
                auxOptions.push({ value: "!=", text: "!=" });
                auxOptions.push({ value: ">", text: ">" });
                auxOptions.push({ value: ">=", text: ">=" });
                auxOptions.push({ value: "<", text: "<" });
                auxOptions.push({ value: "<=", text: "<=" });
                break;
            case "bool":
                auxOptions.push({ value: "=", text: "=" });
                break;
            case "date":
                auxOptions.push({ value: "=", text: "Igual" });
                auxOptions.push({ value: "!=", text: "Diferente" });
                auxOptions.push({ value: ">=", text: "Desde" });
                auxOptions.push({ value: "<=", text: "Hasta" });
                auxOptions.push({ value: ">", text: "Mayor que" });
                auxOptions.push({ value: "<", text: "Menor que" });
                break;
            default:
                auxOptions.push({ value: "=", text: "Igual" });
                break;
        }

        setOptions(auxOptions);
    }

    useEffect(() => {
        const col = props.columns.find(c => c.field === props.field);
        if (col.mytype) {
            printOptions(col.mytype);   
        }
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    const handlerChangeField = (e) => {
        const col = props.columns.find(c => c.field === e.target.value);
        printOptions(col.mytype);        
        props.handlerSelectColumn(e, props.index);
    }

    const printFiled = () => {
        if (props.type !== 'date') {
            return <TextField 
                fullWidth
                onChange={(e) => props.handlerValue(e, props.index)}
                value={props.value} 
                label="Valor" 
                variant="standard" />
        }
        else {
            return <LocalizationProvider dateAdapter={DateAdapter}>
                <DateTimePicker
                    renderInput={(props) => <TextField {...props} />}
                    label="Fecha y hora"
                    value={props.value}
                    onChange={(newValue) => {
                        // console.log(newValue);
                        props.handlerValue(newValue, props.index)
                    }}
                />
            </LocalizationProvider>
        }
    }

    return (
        <div className="item-filter">
            <MdOutlineRemoveCircleOutline onClick={() => props.remove(props.index)} size={25} className='button-remove'/>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 90 }} style={{visibility: props.logicOperator === undefined ? "hidden" : "initial"}}>
                {props.logicOperator !== undefined && <>
                    <InputLabel id="operator-label">Operación</InputLabel>
                    <Select
                    onChange={(e) => props.handlerSelectLogicOperator(e, props.index)}
                    value={props.logicOperator}
                    labelId="operator-label"
                    id="operator"
                    >
                        {operators.map((item, index)=> <MenuItem key={index} value={item.value}>{item.text}</MenuItem>)}
                    </Select>
                </>}
            </FormControl>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="field-label">Campo</InputLabel>
                <Select
                onChange={handlerChangeField}
                value={props.field}
                labelId="field-label"
                id="field"
                >
                    {props.columns.map((item, index)=> {
                        if (item.mytype) {
                            return <MenuItem key={index} value={item.field}>{item.headerName}</MenuItem>
                        }
                        else {
                            return <div key={index}></div>
                        }
                    })}
                </Select>
            </FormControl>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="comparation-label">Comparación</InputLabel>
                <Select
                    onChange={(e) => props.handlerSelectOperator(e, props.index)}
                    value={props.operator}
                    labelId="comparation-label"
                    id="comparation"
                >
                   { options.map((op, index) => <MenuItem key={index} value={op.value}>{op.text}</MenuItem>) }
                </Select>
            </FormControl>
            {printFiled()}
            {/* <TextField 
                onChange={(e) => props.handlerValue(e, props.index)}
                value={props.value} 
                label="Valor" 
                variant="standard" /> */}
        </div>
    );
}

export default ItemFilter;