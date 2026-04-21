import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import api from "./services/api";

jest.mock("./services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe("App", () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: [] });
    localStorage.clear();
  });

  it("muestra la landing publica por defecto", async () => {
    render(<App />);

    expect(screen.getByText("Transforma tu cuerpo")).toBeInTheDocument();
    expect(screen.getByText("Unirme a la plataforma")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/clases");
    });
  });
});
