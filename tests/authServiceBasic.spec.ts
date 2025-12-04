import { describe, test, expect, beforeEach } from "vitest";
import { authService } from "../src/services/auth";

beforeEach(() => {
  localStorage.clear();
});

describe("authService básico", () => {
  test("login() guarda correctamente los datos mínimos", () => {
    authService.login("test@example.com");

    expect(localStorage.getItem("loggedIn")).toBe("true");
    expect(localStorage.getItem("userEmail")).toBe("test@example.com");
  });

  test("logout() limpia la sesión", () => {
    // Prepara datos
    authService.login("user@example.com");
    expect(localStorage.getItem("loggedIn")).toBe("true");

    // Ejecuta logout
    authService.logout();

    expect(localStorage.getItem("loggedIn")).toBeNull();
    expect(localStorage.getItem("userEmail")).toBeNull();
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("userId")).toBeNull();
  });
});
