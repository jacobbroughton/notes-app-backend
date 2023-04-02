import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export const AuthenticatedRoutes = (): JSX.Element => {
  const user = useSelector((state: RootState) => state.user);

  return user ? <Navigate to="/" /> : <Outlet />;
};
