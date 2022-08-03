import { useContext, useEffect, useState } from "react";
import { useLocation, Redirect } from "react-router-dom";
import AppContext from "../../../context/app/app-context";

function RequireNoAuth({children}) {
    const { getDataUser, userLogout, showAlert } = useContext(AppContext);
    let location = useLocation();

    const [user, setUser] = useState(null);
    useEffect(() => {
      setUser(getDataUser());
    }, []);// eslint-disable-line react-hooks/exhaustive-deps
    
    if (user) {
        let path = '/login';
        if (location.pathname === '/login') {
          switch (user.rol.toLowerCase()) {
            case 'super-admin':
                path = '/admin';
              break;
            case 'admin':
                path = '/admin';
              break;
            case 'sub-admin':
                path = '/admin';
              break;
            case 'vigia':
                path = '/vigia';
              break;
            case 'recepcionista':
                path = '/atencion';
              break;
            default:
              userLogout();
              showAlert('red', 'Sin permisos de acceso.');
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