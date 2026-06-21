import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { formatDate } from '../../utils/helpers'
import Modal from '../Common/Modal'
import QuantityChart from './QuantityChart'
import * as XLSX from 'xlsx'
import './Home.css'

const CATEGORIES = [
  'NetBackup Appliance', 'Flex Appliance', 'Other / Shared',
  'Server', 'Storage', 'Networking', 'Accessories', 'Other'
]

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100]

export default function Home() {
  const { user, canEdit, canExport, isReadOnly } = useAuth()
  const { addToast } = useNotification()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [formData, setFormData] = useState({
    product_description: '',
    part_number: '',
    category: '',
    quantity: 1,
    image_url: ''
  })
  const [sortBy, setSortBy] = useState('serial')
  const [sortDir, setSortDir] = useState('asc')

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_archived', false)
        .order(sortBy, { ascending: sortDir === 'asc' })
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortDir, addToast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return (
      p.product_description?.toLowerCase().includes(q) ||
      p.part_number?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      String(p.serial).includes(q)
    )
  })

  const resetForm = () => {
    setFormData({ product_description: '', part_number: '', category: '', quantity: 1, image_url: '' })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!formData.product_description || !formData.part_number || !formData.category) {
      addToast('Please fill all required fields.', 'error')
      return
    }
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          product_description: formData.product_description,
          part_number: formData.part_number,
          category: formData.category,
          quantity: formData.quantity,
          image_url: formData.image_url || null
        }])
        .select()
        .single()
      if (error) throw error

      await supabase.from('activity_logs').insert([{
        product_id: data.id,
        action: 'add',
        description: `Added "${data.product_description}" (${data.part_number})`,
        user_id: user?.id,
        user_name: user?.name
      }])

      addToast('Product added successfully!', 'success')
      setShowAddModal(false)
      resetForm()
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    try {
      const { error } = await supabase
        .from('products')
        .update({
          product_description: formData.product_description,
          part_number: formData.part_number,
          category: formData.category,
          image_url: formData.image_url || null
        })
        .eq('id', selectedProduct.id)
      if (error) throw error

      await supabase.from('activity_logs').insert([{
        product_id: selectedProduct.id,
        action: 'edit',
        description: `Edited "${formData.product_description}"`,
        user_id: user?.id,
        user_name: user?.name
      }])

      addToast('Product updated!', 'success')
      setShowEditModal(false)
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct || deleteConfirm !== 'Delete') return
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id)
      if (error) throw error

      await supabase.from('activity_logs').insert([{
        product_id: selectedProduct.id,
        action: 'delete',
        description: `Deleted "${selectedProduct.product_description}"`,
        user_id: user?.id,
        user_name: user?.name
      }])

      addToast('Product deleted.', 'info')
      setShowDeleteModal(false)
      setDeleteConfirm('')
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleArchive = async () => {
    if (!selectedProduct) return
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', selectedProduct.id)
      if (error) throw error

      await supabase.from('activity_logs').insert([{
        product_id: selectedProduct.id,
        action: 'archived',
        description: `Archived "${selectedProduct.product_description}"`,
        user_id: user?.id,
        user_name: user?.name
      }])

      addToast('Product archived.', 'success')
      setShowArchiveModal(false)
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleQuantityChange = async (product, delta) => {
    if (isReadOnly) {
      addToast('Read-only access. Cannot modify.', 'warning')
      return
    }
    const newQty = product.quantity + delta
    if (newQty < 0) return
    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', product.id)
      if (error) throw error

      await supabase.from('activity_logs').insert([{
        product_id: product.id,
        action: 'edit',
        description: `Changed quantity of "${product.product_description}" from ${product.quantity} to ${newQty} (${delta > 0 ? '+' : ''}${delta})`,
        user_id: user?.id,
        user_name: user?.name
      }])

      addToast(`Quantity ${delta > 0 ? 'increased' : 'decreased'} to ${newQty}`, 'success')
      fetchProducts()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_archived', false)
        .order('serial', { ascending: true })
      if (error) throw error

      const wsData = (data || []).map(p => ({
        'Serial': p.serial,
        'Product Description': p.product_description,
        'Part Number': p.part_number,
        'Category': p.category,
        'Quantity': p.quantity,
        'Date Added': formatDate(p.created_at)
      }))

      const ws = XLSX.utils.json_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `Inventory-${date}.xls`)
      addToast('Exported successfully!', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const openEdit = (product) => {
    setSelectedProduct(product)
    setFormData({
      product_description: product.product_description,
      part_number: product.part_number,
      category: product.category,
      quantity: product.quantity,
      image_url: product.image_url || ''
    })
    setShowEditModal(true)
  }

  const openDelete = (product) => {
    setSelectedProduct(product)
    setDeleteConfirm('')
    setShowDeleteModal(true)
  }

  const openArchive = (product) => {
    setSelectedProduct(product)
    setShowArchiveModal(true)
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ opacity: 0.3 }}>↕</span>
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{filtered.length} product(s) in stock</p>
        </div>
        <div className="home-actions">
          <input
            type="text"
            className="form-input"
            placeholder="Search inventory..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 240, paddingLeft: 36 }}
          />
          {canExport && (
            <button className="btn btn-secondary" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          )}
          {canEdit && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Product
            </button>
          )}
        </div>
      </div>

      <div className="home-grid">
        <div className="card home-table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <h3>No products found</h3>
              <p>{search ? 'Try a different search term.' : 'Add your first product to get started.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ width: 200 }}>Image URL</th>
                    <th onClick={() => handleSort('product_description')} style={{ cursor: 'pointer' }}>
                      Product Description <SortIcon col="product_description" />
                    </th>
                    <th onClick={() => handleSort('part_number')} style={{ cursor: 'pointer' }}>
                      Part Number <SortIcon col="part_number" />
                    </th>
                    <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                      Category <SortIcon col="category" />
                    </th>
                    <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', width: 120 }}>
                      Quantity <SortIcon col="quantity" />
                    </th>
                    <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                      Date Added <SortIcon col="created_at" />
                    </th>
                    {canEdit && <th style={{ width: 140 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product, idx) => (
                    <tr key={product.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        {product.image_url ? (
                          <div className="image-url-cell">
                            <a
                              href={product.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="image-url-link"
                              title={product.image_url}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                              </svg>
                              <span className="image-url-text">View Image</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8125rem' }}>No Image</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{product.product_description}</td>
                      <td><code style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{product.part_number}</code></td>
                      <td><span className="badge badge-primary">{product.category}</span></td>
                      <td>
                        <div className="qty-control">
                          {canEdit && (
                            <button className="qty-btn" onClick={() => handleQuantityChange(product, -1)} disabled={product.quantity <= 0}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          )}
                          <span className={`qty-value ${product.quantity <= 1 ? 'qty-low' : ''}`}>
                            {product.quantity}
                          </span>
                          {canEdit && (
                            <button className="qty-btn" onClick={() => handleQuantityChange(product, 1)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatDate(product.created_at)}</td>
                      {canEdit && (
                        <td>
                          <div className="actions-cell">
                            <button className="btn-icon" onClick={() => openEdit(product)} title="Edit">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            {product.quantity <= 1 && (
                              <button className="btn-icon" onClick={() => openArchive(product)} title="Archive" style={{ color: 'var(--warning)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                                </svg>
                              </button>
                            )}
                            <button className="btn-icon" onClick={() => openDelete(product)} title="Delete" style={{ color: 'var(--danger)' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card home-chart-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
            Quantity Overview
          </h3>
          <QuantityChart products={products} />
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product">
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Product Description *</label>
            <input className="form-input" placeholder="Enter product description"
              value={formData.product_description}
              onChange={e => setFormData(p => ({ ...p, product_description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Part Number *</label>
            <input className="form-input" placeholder="Enter part number"
              value={formData.part_number}
              onChange={e => setFormData(p => ({ ...p, part_number: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <select className="form-input" value={formData.quantity}
                onChange={e => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))}>
                {QUANTITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (optional)</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))}
            />
            {formData.image_url && isValidUrl(formData.image_url) && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={formData.image_url}
                  alt="Preview"
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-light)' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Product</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Product">
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label">Product Description *</label>
            <input className="form-input" placeholder="Enter product description"
              value={formData.product_description}
              onChange={e => setFormData(p => ({ ...p, product_description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Part Number *</label>
            <input className="form-input" placeholder="Enter part number"
              value={formData.part_number}
              onChange={e => setFormData(p => ({ ...p, part_number: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input" value={formData.category}
              onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))}
                style={{ flex: 1 }}
              />
              {formData.image_url && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                  title="Remove image URL"
                  style={{ padding: '10px 12px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {formData.image_url && isValidUrl(formData.image_url) && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={formData.image_url}
                  alt="Preview"
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-light)' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }} title="Confirm Deletion">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Are you sure you want to delete <strong>{selectedProduct?.product_description}</strong>?
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          This action cannot be undone. Type <strong>"Delete"</strong> to confirm.
        </p>
        <input
          className="confirm-input"
          placeholder='Type "Delete" to confirm'
          value={deleteConfirm}
          onChange={e => setDeleteConfirm(e.target.value)}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleteConfirm !== 'Delete'}>Delete</button>
        </div>
      </Modal>

      <Modal isOpen={showArchiveModal} onClose={() => setShowArchiveModal(false)} title="Archive Product">
        <p style={{ color: 'var(--text-secondary)' }}>
          Move <strong>{selectedProduct?.product_description}</strong> to archived products?
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 8 }}>
          Archived products can be viewed in the History page.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={() => setShowArchiveModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleArchive}>Archive</button>
        </div>
      </Modal>


    </div>
  )
}
