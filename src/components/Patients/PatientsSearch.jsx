import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEye } from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/supabaseHelpers";
import { toast } from "sonner";
import Breadcrumbs from "../Breadcrumbs";
import Loader from "../Loader";
const PatientsSearch = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    name: "",
    document: "",
    phone: "",
    email: "",
    gender: "",
    status: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    column: "first_name",
    direction: "asc",
  });
  const handleSearch = async (e) => {
    if (e && e.type === "submit") {
      e.preventDefault();
      setPage(1);
    }
    if (
      !filters.name &&
      !filters.document &&
      !filters.phone &&
      !filters.email &&
      !filters.gender &&
      !filters.status
    ) {
      toast.error("Ingresa al menos un criterio de búsqueda");
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      let query = supabase.from("patients").select("*", { count: "exact" });
      if (filters.name) {
        query = query.or(
          `first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`
        );
      }
      if (filters.document) {
        query = query.ilike("document_number", `%${filters.document}%`);
      }
      if (filters.phone) {
        query = query.ilike("phone", `%${filters.phone}%`);
      }
      if (filters.email) {
        query = query.ilike("email", `%${filters.email}%`);
      }
      if (filters.gender) {
        query = query.eq("gender", filters.gender);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      const { data, error, count } = await safeQuery(() =>
        query
          .order(sortConfig.column, {
            ascending: sortConfig.direction === "asc",
          })
          .range(start, end)
      );
      if (error) throw error;
      setResults(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error searching patients:", error);
      toast.error("Error al buscar pacientes");
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [page, sortConfig]);
  const handleSort = (column) => {
    setSortConfig((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };
  const totalPages = Math.ceil(totalCount / pageSize);
  const SortIndicator = ({ column }) => {
    if (sortConfig.column !== column)
      return <span className="ml-1 text-gray-300 dark:text-[#333333]">↕</span>;
    return (
      <span className="ml-1 text-blue-600 dark:text-blue-400">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };
  const handleClear = () => {
    setFilters({
      name: "",
      document: "",
      phone: "",
      email: "",
      gender: "",
      status: "",
    });
    setResults([]);
    setHasSearched(false);
    setPage(1);
  };
  return (
    <div className="flex flex-col gap-6 p-4 sm:px-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-3">
        <Breadcrumbs
          items={[
            { label: "Pacientes", path: "/home/patients" },
            { label: "Búsqueda Avanzada" },
          ]}
        />
      </div>
      <form
        onSubmit={handleSearch}
        className="bg-white dark:bg-[#111111] p-6 rounded-lg border-2 border-gray-200 dark:border-[#262626] space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-20 shrink-0">
              Nombre
            </label>
            <input
              type="text"
              className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
              placeholder="Nombre o apellido..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-20 shrink-0">
              Documento
            </label>
            <input
              type="text"
              className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
              placeholder="Número de ID..."
              value={filters.document}
              onChange={(e) =>
                setFilters({ ...filters, document: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-20 shrink-0">
              Teléfono
            </label>
            <input
              type="text"
              className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
              placeholder="Teléfono o celular..."
              value={filters.phone}
              onChange={(e) =>
                setFilters({ ...filters, phone: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-20 shrink-0">
              Email
            </label>
            <input
              type="text"
              className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors"
              placeholder="correo@ejemplo.com"
              value={filters.email}
              onChange={(e) =>
                setFilters({ ...filters, email: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-20 shrink-0">
              Género
            </label>
            <select
              className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors appearance-none"
              value={filters.gender}
              onChange={(e) =>
                setFilters({ ...filters, gender: e.target.value })
              }
            >
              <option value="">Cualquiera</option>
              <option value="Male">Masculino</option>
              <option value="Female">Femenino</option>
              <option value="Other">Otro</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-extrabold text-gray-400 dark:text-[#737373] uppercase w-20 shrink-0">
              Estado
            </label>
            <select
              className="flex-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] outline-none text-sm dark:text-[#f5f5f5] focus:border-blue-500 transition-colors appearance-none"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-5 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-[#262626] active:scale-95"
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 cursor-pointer"
          >
            <FiSearch size={16} />
            <span>Realizar Búsqueda</span>
          </button>
        </div>
      </form>
      <div className="bg-white dark:bg-[#111111] rounded-lg border-2 border-gray-200 dark:border-[#262626] overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader />
            <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
              Buscando en base de datos...
            </p>
          </div>
        ) : hasSearched ? (
          results.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#262626]">
                    <tr>
                      <th
                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                        onClick={() => handleSort("first_name")}
                      >
                        <div className="flex items-center">
                          Paciente <SortIndicator column="first_name" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                        onClick={() => handleSort("document_number")}
                      >
                        <div className="flex items-center justify-center">
                          Documento <SortIndicator column="document_number" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center justify-center">
                          Estado <SortIndicator column="status" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-[11px] font-bold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#262626]">
                    {results.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-sm dark:text-[#f5f5f5]">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-[#a3a3a3] font-medium">
                              {patient.phone || "Sin teléfono"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm dark:text-[#e5e5e5] text-center font-medium">
                          {patient.document_type} {patient.document_number}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                              patient.status === "active"
                                ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-[#1a1a1a] dark:text-[#a3a3a3] dark:border-[#262626]"
                            }`}
                          >
                            {patient.status === "active"
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              navigate(`/home/patients/${patient.id}`)
                            }
                            className="p-2 hover:bg-blue-50 dark:hover:bg-[#1f1f1f] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 dark:hover:border-[#262626]"
                            title="Ver detalles"
                          >
                            <FiEye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {}
              {totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-[#1a1a1a] px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-[#262626]">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Mostrando{" "}
                        <span className="font-bold">
                          {(page - 1) * pageSize + 1}
                        </span>{" "}
                        a{" "}
                        <span className="font-bold">
                          {Math.min(page * pageSize, totalCount)}
                        </span>{" "}
                        de <span className="font-bold">{totalCount}</span>{" "}
                        resultados
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() =>
                            setPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <span className="sr-only">Anterior</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-all cursor-pointer ${
                              page === i + 1
                                ? "z-10 bg-blue-600 border-blue-600 text-white"
                                : "bg-white dark:bg-[#111111] border-gray-300 dark:border-[#262626] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] dark:text-[#a3a3a3]"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setPage((prev) => Math.min(prev + 1, totalPages))
                          }
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#111111] text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <span className="sr-only">Siguiente</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <h3 className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-xs">
                Sin resultados
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                No encontramos pacientes con los datos proporcionados.
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <h3 className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-xs">
              Búsqueda Avanzada
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1 max-w-xs">
              Ingresa los criterios arriba para localizar pacientes específicos
              en el sistema.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default PatientsSearch;
