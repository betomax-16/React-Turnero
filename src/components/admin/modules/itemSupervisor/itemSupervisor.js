import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { MdDelete } from "react-icons/md";
import './styles.css';

function ItemSupervisor(props) {
    return (<>
        <div className="itemSupervisor-container">
            <Select fullWidth
                    value={props.data.selectOption}
                    onChange={(e) => props.handleChange(props.id, e)}
                    label="Vigia" >
                        {props.data.options.map((op, index) => <MenuItem  key={index} value={op._id}>{op.name}</MenuItem>)}
            </Select>
            <div className='button-delete'>
                <MdDelete size={30} onClick={() => props.handlerDelete(props.id)}/>
            </div>
        </div>
    </>);
}

export default ItemSupervisor;