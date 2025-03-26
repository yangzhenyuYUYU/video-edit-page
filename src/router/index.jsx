import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';
// 公共页面
import Login from '../pages/Login';
import VideoEdit from '../pages/VideoEdit';

// 主要路由配置
export const mainRoutes = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <VideoEdit />
  },
  {
    path: '/video-edit',
    element: <VideoEdit />
  }
];

const AppRouter = () => {
  return (
    <AuthGuard>
      <Routes>
        {mainRoutes.map((route) => {
          if (route.children) {
            return (
              <Route key={route.path} path={route.path} element={route.element}>
                {route.children.map((child) => {
                  if (child.children) {
                    return (
                      <Route key={child.path} path={child.path}>
                        {child.children.map((subChild) => (
                          <Route
                            key={subChild.path}
                            path={subChild.path}
                            element={subChild.element}
                          />
                        ))}
                      </Route>
                    );
                  }
                  return (
                    <Route
                      key={child.path}
                      path={child.path}
                      element={child.element}
                    />
                  );
                })}
              </Route>
            );
          }
          return <Route key={route.path} path={route.path} element={route.element} />;
        })}
      </Routes>
    </AuthGuard>
  );
};

export default AppRouter;
