import { useContext } from "react";
import { useLocation, Redirect } from "react-router-dom";
import AppContext from "../../../context/app/app-context";

function RequireAuth({children}) {
    const { user, getDataUser } = useContext(AppContext);
    let location = useLocation();

    let auxUser = getDataUser();

    if (!auxUser && !user) {
        return <Redirect to={{
            pathname: "/login",
            state: { referrer: location }
          }}/>;
    }

    return children;
}

export default RequireAuth;