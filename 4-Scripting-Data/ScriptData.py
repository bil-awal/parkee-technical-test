#!/usr/bin/env python3
"""
- File: ScriptData.py
- Deskripsi: Toko retail dengan multi cabang yang perlu menganalisis data transaksi penjualan.
- Author: https://github.com/bil-awal
- 
"""

import pandas as pd
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Protocol
from dataclasses import dataclass
from pathlib import Path


# Konfigurasi logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class TransactionConfig:
    """Configuration untuk transaction processor."""
    input_files: List[str]
    output_file: str
    critical_columns: List[str] = None
    
    def __post_init__(self):
        if self.critical_columns is None:
            self.critical_columns = ['transaction_id', 'date', 'customer_id']


class DataValidator:
    """Validator untuk memastikan data integrity."""
    
    @staticmethod
    def validate_files_exist(file_paths: List[str]) -> bool:
        """Validasi keberadaan file."""
        missing_files = [f for f in file_paths if not Path(f).exists()]
        
        if missing_files:
            logger.error(f"File tidak ditemukan: {missing_files}")
            return False
        return True
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame, required_columns: List[str]) -> bool:
        """Validasi struktur dataframe."""
        missing_cols = set(required_columns) - set(df.columns)
        if missing_cols:
            logger.error(f"Kolom yang diperlukan tidak ada: {missing_cols}")
            return False
        return True


class FileRepository:
    """Repository pattern untuk file operations."""
    
    def read_csv(self, filepath: str) -> pd.DataFrame:
        """Membaca file CSV dengan error handling."""
        try:
            df = pd.read_csv(filepath)
            logger.info(f"Berhasil membaca {filepath}: {len(df)} baris")
            return df
        except Exception as e:
            logger.error(f"Error membaca {filepath}: {e}")
            raise
    
    def write_csv(self, df: pd.DataFrame, filepath: str) -> None:
        """Menyimpan dataframe ke CSV."""
        try:
            df.to_csv(filepath, index=False)
            logger.info(f"Berhasil menyimpan ke {filepath}")
        except Exception as e:
            logger.error(f"Error menyimpan {filepath}: {e}")
            raise
    
    def read_multiple_csv(self, filepaths: List[str]) -> pd.DataFrame:
        """Membaca dan menggabungkan multiple CSV files."""
        dataframes = []
        for filepath in filepaths:
            df = self.read_csv(filepath)
            dataframes.append(df)
        
        combined = pd.concat(dataframes, ignore_index=True)
        logger.info(f"Total gabungan: {len(combined)} baris")
        return combined


class DataCleaningStrategy(ABC):
    """Abstract base class untuk cleaning strategies."""
    
    @abstractmethod
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Method yang harus diimplementasi oleh concrete strategy."""
        pass


class RemoveNullStrategy(DataCleaningStrategy):
    """Strategy untuk menghapus null values."""
    
    def __init__(self, columns: List[str]):
        self.columns = columns
    
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        initial_count = len(df)
        cleaned = df.dropna(subset=self.columns)
        removed = initial_count - len(cleaned)
        logger.info(f"Removed {removed} rows with null values")
        return cleaned


class DateConversionStrategy(DataCleaningStrategy):
    """Strategy untuk konversi date column."""
    
    def __init__(self, date_column: str = 'date'):
        self.date_column = date_column
    
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        df[self.date_column] = pd.to_datetime(df[self.date_column], errors='coerce')
        initial = len(df)
        cleaned = df.dropna(subset=[self.date_column])
        if initial > len(cleaned):
            logger.info(f"Removed {initial - len(cleaned)} rows with invalid dates")
        return cleaned


class RemoveDuplicatesStrategy(DataCleaningStrategy):
    """Strategy untuk menghapus duplikat."""
    
    def __init__(self, subset: List[str], keep: str = 'first'):
        self.subset = subset
        self.keep = keep
    
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        # Sort by date descending untuk keep data terbaru
        df_sorted = df.sort_values('date', ascending=False)
        initial = len(df_sorted)
        cleaned = df_sorted.drop_duplicates(subset=self.subset, keep=self.keep)
        removed = initial - len(cleaned)
        logger.info(f"Removed {removed} duplicate rows")
        return cleaned


class DataCleaner:
    """Orchestrator untuk cleaning strategies."""
    
    def __init__(self):
        self.strategies: List[DataCleaningStrategy] = []
    
    def add_strategy(self, strategy: DataCleaningStrategy) -> 'DataCleaner':
        """Builder pattern untuk chaining strategies."""
        self.strategies.append(strategy)
        return self
    
    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply semua cleaning strategies."""
        result = df.copy()
        for strategy in self.strategies:
            result = strategy.clean(result)
        return result


class SalesCalculator:
    """Calculator untuk business logic."""
    
    @staticmethod
    def calculate_transaction_amount(df: pd.DataFrame) -> pd.DataFrame:
        """Hitung total amount per transaksi."""
        df['total_amount'] = df['quantity'] * df['price']
        return df
    
    @staticmethod
    def aggregate_by_branch(df: pd.DataFrame) -> pd.DataFrame:
        """Agregasi total sales per branch."""
        summary = df.groupby('branch')['total_amount'].sum().reset_index()
        summary.columns = ['branch', 'total']
        return summary.sort_values('branch')


class TransactionProcessor:
    """Main processor menggunakan dependency injection."""
    
    def __init__(self, 
                 config: TransactionConfig,
                 repository: FileRepository,
                 cleaner: DataCleaner,
                 calculator: SalesCalculator):
        self.config = config
        self.repository = repository
        self.cleaner = cleaner
        self.calculator = calculator
    
    def process(self) -> pd.DataFrame:
        """Main processing method."""
        # Validate files
        if not DataValidator.validate_files_exist(self.config.input_files):
            raise FileNotFoundError("Input files tidak ditemukan")
        
        # Load data
        logger.info("Loading data...")
        combined_df = self.repository.read_multiple_csv(self.config.input_files)
        
        # Clean data
        logger.info("Cleaning data...")
        cleaned_df = self.cleaner.clean(combined_df)
        logger.info(f"Data cleaned: {len(cleaned_df)} rows remaining")
        
        # Calculate sales
        logger.info("Calculating sales...")
        df_with_amount = self.calculator.calculate_transaction_amount(cleaned_df)
        summary = self.calculator.aggregate_by_branch(df_with_amount)
        
        # Log results
        for _, row in summary.iterrows():
            logger.info(f"Branch {row['branch']}: {row['total']:,.1f}")
        
        # Save results
        self.repository.write_csv(summary, self.config.output_file)
        
        return summary


class ProcessorFactory:
    """Factory untuk membuat processor dengan konfigurasi default."""
    
    @staticmethod
    def create_default_processor() -> TransactionProcessor:
        """Create processor dengan default configuration."""
        config = TransactionConfig(
            input_files=['branch_a.csv', 'branch_b.csv', 'branch_c.csv'],
            output_file='total_sales_per_branch.csv'
        )
        
        repository = FileRepository()
        
        cleaner = (DataCleaner()
                  .add_strategy(RemoveNullStrategy(config.critical_columns))
                  .add_strategy(DateConversionStrategy())
                  .add_strategy(RemoveDuplicatesStrategy(['transaction_id'])))
        
        calculator = SalesCalculator()
        
        return TransactionProcessor(config, repository, cleaner, calculator)


def main():
    """Entry point aplikasi."""
    try:
        # Create processor menggunakan factory
        processor = ProcessorFactory.create_default_processor()
        
        # Process data
        result = processor.process()
        
        # Display result
        print("\n" + "="*50)
        print("PROSES SELESAI")
        print("="*50)
        print(f"\nHasil tersimpan di: {processor.config.output_file}")
        print("\nSummary:")
        print(result.to_string(index=False))
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())