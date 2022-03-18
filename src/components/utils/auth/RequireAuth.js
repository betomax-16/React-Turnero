import { useContext } from "react";
import { useLocation, Redirect } from "react-router-dom";
import AppContext from "../../../context/app/app-context";

function RequireAuth({children}) {
    const { getDataUser } = useContext(AppContext);
    const location = useLocation();

    const user = getDataUser();

    if (!user) {
        return <Redirect to={{
            pathname: "/login",
            state: { referrer: location }
          }}/>;
    }

    return children;
}

export default RequireAuth;