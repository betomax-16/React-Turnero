import { useContext, useEffect } from "react";
import AppContext from "../../context/app/app-context";
import './styles.css';

function MessageDown(props) {
  const { alert, hideAlert } = useContext(AppContext);
  useEffect(() => {
    if (alert.show) {
      setTimeout(hideAlert, 8000);
    }
  }, [alert.show]);// eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={ alert.show ? `message-container ${alert.color} show` : `message-container ${alert.color} down` }>
      <span className="message">{alert.message}</span>
      <span className="button-close" onClick={()=> hideAlert()}>X</span>
    </div>
  );
}

export default MessageDown;
