const reducer = (state, action) => {
    const {payload, type} = action;

    switch (type) {
        case 'SET_ALERT':
            return {
                ...state,
                alert: payload
            }
        case 'SET_USER':
            return {
                ...state,
                user: payload
            }
        case 'SET_RESET':
            return {
                ...state,
                reset: payload
            }
        case 'SET_MODULE':
            return {
                ...state,
                module: payload
            }
        case 'SET_CURRENT_SUCURSAL':
            return {
                ...state,
                currentSucursal: payload
            }
        default:
            return state;
    }
}

export default reducer