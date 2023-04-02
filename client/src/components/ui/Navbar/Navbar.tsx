import { useState, useRef, useEffect, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { RootState } from "../../../redux/store";
import Caret from "../Icons/Caret";
import { setUser } from "../../../redux/user";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "./Navbar.css";
import { FormEvent } from "react";
import { throwResponseStatusError } from "../../../utils/throwResponseStatusError";
import { getApiUrl } from "../../../utils/getUrl";

const Navbar = () => {
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const [navDropdownToggled, setNavDropdownToggled] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      if (
        navDropdownRef.current &&
        !navDropdownRef.current.contains(e.target as HTMLElement) &&
        !(e.target as HTMLElement).classList.contains("nav-dropdown-toggle")
      ) {
        setNavDropdownToggled(false);
      }
    }

    window.addEventListener("click", handler);

    return () => {
      window.removeEventListener("click", handler);
    };
  });

  async function handleLogout(e: FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch(`${getApiUrl()}/logout/`, {
        credentials: "include",
      });

      if (response.status !== 200) throwResponseStatusError(response, "GET");

      const data = await response.json();

      if (!data) throw "There was a problem parsing logout response";

      dispatch(setUser(null));
      setNavDropdownToggled(false);
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <nav>
      <div className="container">
        <p>Notes</p>
        <div className="nav-links">
          {user ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNavDropdownToggled(!navDropdownToggled);
                }}
                className="nav-dropdown-toggle"
              >
                <img
                  src={`https://avatars.dicebear.com/api/initials/${user.USERNAME}.svg?backgroundColor=%23646cff`}
                />
                {user.USERNAME[0].toUpperCase() +
                  user.USERNAME.slice(1, user.USERNAME.length)}{" "}
                <Caret direction={navDropdownToggled ? "up" : "down"} />
              </button>
              {navDropdownToggled && (
                <div className="nav-dropdown" ref={navDropdownRef}>
                  <Link to="/">Home</Link>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
