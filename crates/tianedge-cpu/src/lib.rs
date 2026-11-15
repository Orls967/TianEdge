//! TIANEDGE CPU execution engine crate (`tianedge-cpu`).
//!
//! Pure Rust implementation of `TIAN-ISA v1` compiled to WebAssembly (`wasm32-unknown-unknown`)
//! for local deterministic execution inside a Web Worker.

pub fn engine_version() -> &'static str {
    "1.0.0"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn crate_baseline_version() {
        assert_eq!(engine_version(), "1.0.0");
    }
}
