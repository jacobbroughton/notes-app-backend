import { FormEvent, useRef, useEffect, MouseEvent } from "react";
import { useDispatch } from "react-redux";
import { resetUserState, setUser } from "../../../redux/user";
import { Link, useNavigate } from "react-router-dom";
import "./UserMenu.css";
import { getApiUrl } from "../../../utils/getUrl";
import { resetThemeState } from "../../../redux/theme";
import { resetTagsState } from "../../../redux/tags";
import { resetSidebarState } from "../../../redux/sidebar";
import { resetPagesState } from "../../../redux/pages";
import { resetFoldersState } from "../../../redux/folders";
import { resetModalsState } from "../../../redux/modals";
import { resetCombinedState } from "../../../redux/combined";
import { resetColorPickerMenuState } from "../../../redux/colorPickerMenu";

const UserMenu = ({
  setUserMenuToggled,
}: {
  setUserMenuToggled: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  async function handleLogout(e: FormEvent) {
    e.preventDefault();

    await fetch(`${getApiUrl()}/logout/`, {
      credentials: "include",
    });

    // dispatch(setUser(null));
    dispatch(resetUserState())
    dispatch(resetThemeState())
    dispatch(resetTagsState())
    dispatch(resetSidebarState())
    dispatch(resetPagesState())
    dispatch(resetFoldersState())
    dispatch(resetModalsState())
    dispatch(resetCombinedState())
    dispatch(resetColorPickerMenuState())
    setUserMenuToggled(false);
    navigate("/login");
  }

  useEffect(() => {
    function handler(e: Event) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains((e.target as HTMLElement)) &&
        !(e.target as HTMLElement).classList.contains("user-button") && 
        !(e.target as HTMLElement).classList.contains("user-icon")
      ) {
        setUserMenuToggled(false);
      }
    }

    window.addEventListener("click", handler);

    return () => window.removeEventListener("click", handler);
  });


  return (
    <div className="user-menu" ref={userMenuRef}>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default UserMenu;
