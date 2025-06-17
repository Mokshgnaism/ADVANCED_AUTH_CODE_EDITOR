import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import InviteFriends from "../components/InviteFriends"; // make sure the path is correct

const socket = io("http://localhost:5000");

export default function RoomPage() {
  const { id: roomId } = useParams();
  const [code, setCode] = useState(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  const editorRef = useRef(null);
  const skipEmitRef = useRef(false);

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("code-update", ({ code: newCode }) => {
      const editor = editorRef.current;
      setCode(newCode);

      if (editor && editor.getValue() !== newCode) {
        skipEmitRef.current = true;
        editor.setValue(newCode);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      if (skipEmitRef.current) {
        skipEmitRef.current = false;
        return;
      }
      const updatedCode = editor.getValue();
      setCode(updatedCode);
      socket.emit("code-change", { roomId, code: updatedCode });
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Invite Button */}
      <div className="p-4 flex justify-between items-center bg-gray-100 dark:bg-gray-800 border-b">
        <h2 className="text-lg font-semibold">Room ID: {roomId}</h2>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setShowInviteBox(!showInviteBox)}
        >
          {showInviteBox ? "Hide Invite Box" : "Invite Friends"}
        </button>
      </div>

      {/* Invite Friends Box */}
      {showInviteBox && (
        <div className="p-4 border-b bg-white dark:bg-gray-900">
          <InviteFriends roomId={roomId} />
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          value={code ?? "// Loading..."}
          theme="vs-dark"
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
}
