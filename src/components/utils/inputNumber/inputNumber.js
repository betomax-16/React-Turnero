import './styles.css';

function InputNumber(props) {
    return (
        <div className='input-number-container'>
            <label className='label'>{props.label}</label>
            <input className='input' type='number' min={0} value={props.value} onChange={(e) => props.onChange(props.index, e.target.value)}/>
        </div>
    );
}

export default InputNumber;