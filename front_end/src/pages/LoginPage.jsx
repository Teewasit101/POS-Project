import "./LoginPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        Swal.fire("Success", "Login successful!", "success").then(() => {
          navigate("/dashboard");
        });
      } else {
        Swal.fire("Error", data.message || "Login failed", "error");
      }
    } catch (error) {
      Swal.fire("Error", "An error occurred. Please try again.", "error");
    }
  };
}

export default function LoginPage() {
  return (
    <div className="bbody">
      <div className="login-container">
        <h1>Login</h1>
        <form className="login-form">
          <div>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
