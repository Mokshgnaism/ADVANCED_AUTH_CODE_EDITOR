import { Navigate, Route, Routes } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import { Toaster } from "react-hot-toast";

import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import FriendPage from "./pages/friendPage.jsx";
import AddFriendsPage from "../src/pages/AddFriendsPage.jsx"
import PastRooms from "./pages/PastRooms.jsx";
import RoomPage from "./pages/RoomPage.jsx";
import RoomInvitationPage from "./pages/RoomIvitationPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = Boolean(authUser);
  const isVerified = authUser?.isVerified;

  if (isLoading) return <PageLoader />;
  console.log(authUser);
  return (
    <div className="h-screen" data-theme={theme}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? <SignUpPage /> : <Navigate to={isVerified ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to={isVerified ? "/" : "/onboarding"} />
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/friends"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <FriendPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />


        <Route
          path="/friends"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <FriendPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/Room/:id"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={false}>
                <RoomPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/addFriends"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <AddFriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/RoomInvitations"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <RoomInvitationPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />


        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isVerified ? (
                <ChatPage userId={authUser._id} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />





        <Route
          path="/pastRooms"
          element={
            isAuthenticated && isVerified ? (
              <Layout showSidebar={true}>
                <PastRooms />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />



        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isVerified ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
