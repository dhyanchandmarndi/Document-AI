import React from "react";
import "./../../../Frontend/src/index.css";

const Dashboard = () => {
  return (
    <div>
      <div className="main-container">
        <h1 className="logo">perplexity pro</h1>
        <div className="ask-container">
          <div className="chat-container">
            <form className="chat-form">
              <textarea
                className="chat-text-area"
                placeholder="Ask anything"
              ></textarea>
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
