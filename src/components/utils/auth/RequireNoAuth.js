import { useContext } from "react";
import { useLocation, Redirect } from "react-router-dom";
import AppContext from "../../../context/app/app-context";

function RequireNoAuth({children}) {
    const { user } = useContext(AppContext);
    let location = useLocation();

    if (user) {
        let path = '/atencion';
        if (location.pathname === '/login') {
          switch (user.rol.toLowerCase()) {
            case 'admin':
                path = '/admin';
              break;
            case 'vigia':
                path = '/vigia';
              break;
            case 'recepcionista':
                path = '/atencion';
              break;
            default:
              break;
          }
        }
        else {
          path = location.pathname
        }

        return <Redirect to={{
            pathname: path,
            state: { referrer: location }
        }}/>;
    }

    return children;
}

export default RequireNoAuth;