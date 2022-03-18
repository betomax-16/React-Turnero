import { useContext, useEffect } from "react";
import { Switch, Redirect } from "react-router-dom";
import AppContext from "./context/app/app-context";
import routes  from "./routes/index";
import RouteWithSubRoutes from "./routes/routeWithSubRoutes";
import MessageDown from "./components/messageDown/messageDown";
import './App.css';

function App() {
  const { userLogin } = useContext(AppContext);
  useEffect(() => {
    userLogin();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  return (<>
    <div className="app-container">
      <Switch>
        <Redirect exact from='/' to='/login' />
        {routes.map((route, i) => (
            <RouteWithSubRoutes key={i} {...route} />
        ))}
      </Switch>
      <MessageDown/>
    </div>
  </>);
}

export default App;
